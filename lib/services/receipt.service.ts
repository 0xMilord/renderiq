import PDFDocument from 'pdfkit';
import { db } from '@/lib/db';
import { invoices, paymentOrders, users, creditPackages, subscriptionPlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { StorageService } from './storage';
import { InvoiceService } from './invoice.service';
import { logger } from '@/lib/utils/logger';

export class ReceiptService {
  /**
   * Generate PDF receipt for a payment order
   */
  static async generateReceiptPdf(paymentOrderId: string): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
    try {
      logger.log('🧾 ReceiptService: Generating receipt PDF for payment order:', paymentOrderId);

      // Get payment order
      const [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, paymentOrderId))
        .limit(1);

      if (!paymentOrder) {
        return { success: false, error: 'Payment order not found' };
      }

      // Get or create invoice
      let invoiceResult = await InvoiceService.getInvoiceByNumber(paymentOrder.invoiceNumber || '');
      if (!invoiceResult.success || !invoiceResult.data) {
        // Create invoice if it doesn't exist
        invoiceResult = await InvoiceService.createInvoice(paymentOrderId);
      }

      const invoice = invoiceResult.data;
      if (!invoice) {
        return { success: false, error: 'Failed to create invoice' };
      }

      // Get user details
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, paymentOrder.userId))
        .limit(1);

      // Get reference details
      let referenceDetails: any = {};
      let itemDescription = '';
      if (paymentOrder.type === 'credit_package' && paymentOrder.referenceId) {
        const [packageData] = await db
          .select()
          .from(creditPackages)
          .where(eq(creditPackages.id, paymentOrder.referenceId))
          .limit(1);
        referenceDetails = packageData;
        itemDescription = `${packageData?.name || 'Credit Package'} - ${packageData?.credits || 0} credits${packageData?.bonusCredits > 0 ? ` + ${packageData.bonusCredits} bonus` : ''}`;
      } else if (paymentOrder.type === 'subscription' && paymentOrder.referenceId) {
        const [plan] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, paymentOrder.referenceId))
          .limit(1);
        referenceDetails = plan;
        itemDescription = `${plan?.name || 'Subscription Plan'} - ${plan?.creditsPerMonth || 0} credits/month`;
      }

      // Generate PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {});

      // Header
      doc.fontSize(24).text('Receipt', { align: 'center' });
      doc.moveDown();

      // Company Info
      doc.fontSize(10).text('RenderIQ', { align: 'center' });
      doc.text('AI-Powered Rendering Platform', { align: 'center' });
      doc.moveDown(2);

      // Invoice Number
      doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`, { align: 'left' });
      doc.text(`Date: ${new Date(paymentOrder.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'left' });
      doc.moveDown();

      // Customer Info
      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10);
      if (user?.name) doc.text(user.name);
      if (user?.email) doc.text(user.email);
      doc.moveDown();

      // Items Table
      doc.fontSize(12).text('Items:', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const itemHeight = 30;

      // Table Header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Amount', 450, tableTop, { align: 'right' });
      doc.moveDown();

      // Table Row
      doc.font('Helvetica');
      const amount = parseFloat(paymentOrder.amount || '0');
      const taxAmount = parseFloat(paymentOrder.taxAmount || '0');
      const discountAmount = parseFloat(paymentOrder.discountAmount || '0');
      const totalAmount = amount + taxAmount - discountAmount;

      doc.text(itemDescription || 'Payment', 50);
      doc.text(`${paymentOrder.currency || 'INR'} ${amount.toFixed(2)}`, 450, doc.y - 15, { align: 'right' });
      doc.moveDown();

      // Totals
      doc.moveDown();
      doc.fontSize(10);
      if (discountAmount > 0) {
        doc.text(`Discount:`, 350, doc.y, { align: 'right' });
        doc.text(`-${paymentOrder.currency || 'INR'} ${discountAmount.toFixed(2)}`, 450, doc.y - 15, { align: 'right' });
        doc.moveDown();
      }
      if (taxAmount > 0) {
        doc.text(`Tax:`, 350, doc.y, { align: 'right' });
        doc.text(`${paymentOrder.currency || 'INR'} ${taxAmount.toFixed(2)}`, 450, doc.y - 15, { align: 'right' });
        doc.moveDown();
      }
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`Total:`, 350, doc.y, { align: 'right' });
      doc.text(`${paymentOrder.currency || 'INR'} ${totalAmount.toFixed(2)}`, 450, doc.y - 15, { align: 'right' });
      doc.moveDown(2);

      // Payment Info
      doc.fontSize(10).font('Helvetica');
      doc.text('Payment Information:', { underline: true });
      doc.text(`Payment ID: ${paymentOrder.razorpayPaymentId || 'N/A'}`);
      doc.text(`Order ID: ${paymentOrder.razorpayOrderId || 'N/A'}`);
      doc.text(`Status: ${paymentOrder.status.toUpperCase()}`);
      doc.moveDown();

      // Footer
      doc.fontSize(8).text('Thank you for your business!', { align: 'center' });
      doc.text('This is a computer-generated receipt.', { align: 'center' });

      doc.end();

      // Wait for PDF to be generated
      await new Promise<void>((resolve) => {
        doc.on('end', resolve);
      });

      const pdfBuffer = Buffer.concat(chunks);

      // Upload PDF to storage (using uploads bucket for receipts)
      const fileName = `receipt_${invoice.invoiceNumber}_${Date.now()}.pdf`;
      const uploadResult = await StorageService.uploadFile(
        pdfBuffer,
        'uploads',
        paymentOrder.userId,
        fileName
      );

      // Update invoice and payment order with PDF URL
      await InvoiceService.updateInvoicePdfUrl(invoice.id, uploadResult.url);
      await db
        .update(paymentOrders)
        .set({
          receiptPdfUrl: uploadResult.url,
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, paymentOrderId));

      logger.log('✅ ReceiptService: Receipt PDF generated:', uploadResult.url);

      return {
        success: true,
        pdfUrl: uploadResult.url,
      };
    } catch (error) {
      logger.error('❌ ReceiptService: Error generating receipt PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate receipt PDF',
      };
    }
  }

  /**
   * Send receipt email to user (placeholder - implement email service integration)
   */
  static async sendReceiptEmail(paymentOrderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.log('📧 ReceiptService: Sending receipt email for payment order:', paymentOrderId);

      // Get payment order
      const [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, paymentOrderId))
        .limit(1);

      if (!paymentOrder) {
        return { success: false, error: 'Payment order not found' };
      }

      // Generate receipt if not already generated
      if (!paymentOrder.receiptPdfUrl) {
        const receiptResult = await this.generateReceiptPdf(paymentOrderId);
        if (!receiptResult.success) {
          return { success: false, error: 'Failed to generate receipt' };
        }
      }

      // Get user details
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, paymentOrder.userId))
        .limit(1);

      if (!user?.email) {
        return { success: false, error: 'User email not found' };
      }

      // TODO: Integrate with email service (Resend, SendGrid, etc.)
      // For now, just log
      logger.log('📧 ReceiptService: Would send receipt email to:', user.email);

      // Update receipt sent timestamp
      await db
        .update(paymentOrders)
        .set({
          receiptSentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, paymentOrderId));

      return { success: true };
    } catch (error) {
      logger.error('❌ ReceiptService: Error sending receipt email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send receipt email',
      };
    }
  }
}

