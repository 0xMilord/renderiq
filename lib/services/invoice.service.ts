import { db } from '@/lib/db';
import { invoices, paymentOrders, users, creditPackages, subscriptionPlans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export class InvoiceService {
  /**
   * Generate a unique invoice number
   * Format: INV-YYYYMMDD-XXXXX
   */
  static async generateInvoiceNumber(): Promise<string> {
    try {
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `INV-${datePrefix}-`;

      // Get the last invoice number for today
      const todayInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, prefix + '00001'))
        .limit(1);

      // Find the highest sequence number for today
      const allTodayInvoices = await db
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices)
        .where(eq(invoices.invoiceNumber, prefix + '00001'));

      // Simple approach: use timestamp + random for uniqueness
      const sequence = Date.now().toString().slice(-5);
      const invoiceNumber = `${prefix}${sequence}`;

      // Verify uniqueness
      const [existing] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .limit(1);

      if (existing) {
        // If collision, append random number
        return `${invoiceNumber}-${Math.floor(Math.random() * 1000)}`;
      }

      return invoiceNumber;
    } catch (error) {
      logger.error('❌ InvoiceService: Error generating invoice number:', error);
      // Fallback to timestamp-based number
      return `INV-${Date.now()}`;
    }
  }

  /**
   * Create an invoice record for a payment order
   */
  static async createInvoice(paymentOrderId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.log('📄 InvoiceService: Creating invoice for payment order:', paymentOrderId);

      // ✅ OPTIMIZED: Fetch payment order and check for existing invoice in parallel
      const [paymentOrderResult, existingInvoiceResult] = await Promise.all([
        db
          .select()
          .from(paymentOrders)
          .where(eq(paymentOrders.id, paymentOrderId))
          .limit(1),
        db
          .select()
          .from(invoices)
          .where(eq(invoices.paymentOrderId, paymentOrderId))
          .limit(1),
      ]);

      const [paymentOrder] = paymentOrderResult;
      if (!paymentOrder) {
        return { success: false, error: 'Payment order not found' };
      }

      // Check if invoice already exists
      const [existingInvoice] = existingInvoiceResult;
      if (existingInvoice) {
        logger.log('📄 InvoiceService: Invoice already exists:', existingInvoice.id);
        return { success: true, data: existingInvoice };
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Calculate amounts
      const amount = parseFloat(paymentOrder.amount || '0');
      const taxAmount = parseFloat(paymentOrder.taxAmount || '0');
      const discountAmount = parseFloat(paymentOrder.discountAmount || '0');
      const totalAmount = amount + taxAmount - discountAmount;

      // ✅ OPTIMIZED: Fetch user and reference details in parallel
      const [userResult, referenceDetailsResult] = await Promise.all([
        db
          .select()
          .from(users)
          .where(eq(users.id, paymentOrder.userId))
          .limit(1),
        // Fetch reference details based on payment type
        paymentOrder.type === 'credit_package' && paymentOrder.referenceId
          ? db
              .select()
              .from(creditPackages)
              .where(eq(creditPackages.id, paymentOrder.referenceId))
              .limit(1)
          : paymentOrder.type === 'subscription' && paymentOrder.referenceId
          ? db
              .select()
              .from(subscriptionPlans)
              .where(eq(subscriptionPlans.id, paymentOrder.referenceId))
              .limit(1)
          : Promise.resolve([]),
      ]);

      const [user] = userResult;
      
      // Get reference details
      let referenceDetails: any = {};
      if (paymentOrder.type === 'credit_package' && paymentOrder.referenceId) {
        const [packageData] = referenceDetailsResult as any[];
        referenceDetails = packageData;
      } else if (paymentOrder.type === 'subscription' && paymentOrder.referenceId) {
        const [plan] = referenceDetailsResult as any[];
        referenceDetails = plan;
      }

      // Create invoice record
      const [invoice] = await db
        .insert(invoices)
        .values({
          invoiceNumber,
          paymentOrderId: paymentOrder.id,
          userId: paymentOrder.userId,
          amount: amount.toString(),
          taxAmount: taxAmount.toString(),
          discountAmount: discountAmount.toString(),
          totalAmount: totalAmount.toString(),
          currency: paymentOrder.currency || 'INR',
          status: paymentOrder.status === 'completed' ? 'paid' : 'pending',
          metadata: {
            type: paymentOrder.type,
            referenceId: paymentOrder.referenceId,
            referenceDetails,
            razorpayOrderId: paymentOrder.razorpayOrderId,
            razorpayPaymentId: paymentOrder.razorpayPaymentId,
            userEmail: user?.email,
            userName: user?.name,
          },
        })
        .returning();

      // Update payment order with invoice number
      await db
        .update(paymentOrders)
        .set({
          invoiceNumber,
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, paymentOrderId));

      logger.log('✅ InvoiceService: Invoice created:', invoice.id);

      // Send invoice email if payment is completed
      if (paymentOrder.status === 'completed' && user?.email) {
        try {
          const { sendInvoiceEmail } = await import('@/lib/services/email.service');
          // Get app URL - use production URL in production
          const isProduction = process.env.NODE_ENV === 'production';
          const appUrl = isProduction 
            ? (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://renderiq.io')
            : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
          const invoiceUrl = invoice.invoicePdfUrl 
            ? `${appUrl}/api/payments/invoice/${invoice.invoiceNumber}`
            : undefined;

          await sendInvoiceEmail({
            name: user.name || 'User',
            email: user.email,
            amount: totalAmount,
            currency: paymentOrder.currency || 'INR',
            orderId: paymentOrder.id,
            invoiceNumber: invoice.invoiceNumber,
            invoiceUrl: invoiceUrl,
            paymentDate: paymentOrder.createdAt || new Date(),
            items: [
              {
                name: paymentOrder.type === 'credit_package' 
                  ? (referenceDetails?.name || 'Credit Package')
                  : (referenceDetails?.name || 'Subscription'),
                quantity: 1,
                price: totalAmount,
              },
            ],
          });
        } catch (error) {
          logger.error('❌ InvoiceService: Failed to send invoice email:', error);
          // Don't fail invoice creation if email fails
        }
      }

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      logger.error('❌ InvoiceService: Error creating invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invoice',
      };
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      return { success: true, data: invoice };
    } catch (error) {
      logger.error('❌ InvoiceService: Error getting invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invoice',
      };
    }
  }

  /**
   * Get invoice by invoice number
   */
  static async getInvoiceByNumber(invoiceNumber: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .limit(1);

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      return { success: true, data: invoice };
    } catch (error) {
      logger.error('❌ InvoiceService: Error getting invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invoice',
      };
    }
  }

  /**
   * Get invoices for a user
   */
  static async getUserInvoices(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const conditions: any[] = [eq(invoices.userId, userId)];

      if (options?.status) {
        conditions.push(eq(invoices.status, options.status));
      }

      const result = await db
        .select()
        .from(invoices)
        .where(and(...conditions))
        .orderBy(invoices.createdAt)
        .limit(options?.limit || 20)
        .offset(options?.offset || 0);

      return { success: true, data: result };
    } catch (error) {
      logger.error('❌ InvoiceService: Error getting user invoices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invoices',
      };
    }
  }

  /**
   * Update invoice PDF URL
   */
  static async updateInvoicePdfUrl(invoiceId: string, pdfUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      await db
        .update(invoices)
        .set({
          pdfUrl,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));

      return { success: true };
    } catch (error) {
      logger.error('❌ InvoiceService: Error updating invoice PDF URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update invoice PDF URL',
      };
    }
  }
}

