import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
      
      // Note: PDFKit font loading errors are caught and handled below
      // If fonts fail to load, PDFKit will use fallback fonts

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

      // Generate PDF using pdf-lib (much simpler and more reliable than PDFKit)
      try {
        // Create PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4 size in points (72 DPI)
        const { width, height } = page.getSize();
        
        // Load fonts
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let yPosition = height - 50; // Start from top with margin
        
        // Helper function to center text
        const centerText = (text: string, fontSize: number, font: any) => {
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          return (width - textWidth) / 2;
        };
        
        // Header
        page.drawText('Receipt', {
          x: centerText('Receipt', 24, helveticaBoldFont),
          y: yPosition,
          size: 24,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 40;
        
        // Company Info
        page.drawText('Renderiq', {
          x: centerText('Renderiq', 10, helveticaFont),
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
        page.drawText('AI-Powered Rendering Platform', {
          x: centerText('AI-Powered Rendering Platform', 10, helveticaFont),
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPosition -= 40;
        
        // Invoice Number
        page.drawText(`Invoice Number: ${invoice.invoiceNumber}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        page.drawText(`Date: ${new Date(paymentOrder.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 40;
        
        // Customer Info
        page.drawText('Bill To:', {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        if (user?.name) {
          page.drawText(user.name, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= 15;
        }
        if (user?.email) {
          page.drawText(user.email, {
            x: 50,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= 30;
        }
        
        // Items Table Header
        page.drawText('Items:', {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 25;
        
        page.drawText('Description', {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        page.drawText('Amount', {
          x: width - 150,
          y: yPosition,
          size: 10,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 25;
        
        // Table Row
        const amount = parseFloat(paymentOrder.amount || '0');
        const taxAmount = parseFloat(paymentOrder.taxAmount || '0');
        const discountAmount = parseFloat(paymentOrder.discountAmount || '0');
        const totalAmount = amount + taxAmount - discountAmount;
        
        page.drawText(itemDescription || 'Payment', {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        page.drawText(`${paymentOrder.currency || 'INR'} ${amount.toFixed(2)}`, {
          x: width - 150,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 30;
        
        // Totals
        if (discountAmount > 0) {
          page.drawText('Discount:', {
            x: width - 250,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          page.drawText(`-${paymentOrder.currency || 'INR'} ${discountAmount.toFixed(2)}`, {
            x: width - 150,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= 20;
        }
        if (taxAmount > 0) {
          page.drawText('Tax:', {
            x: width - 250,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          page.drawText(`${paymentOrder.currency || 'INR'} ${taxAmount.toFixed(2)}`, {
            x: width - 150,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          yPosition -= 20;
        }
        page.drawText('Total:', {
          x: width - 250,
          y: yPosition,
          size: 12,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        page.drawText(`${paymentOrder.currency || 'INR'} ${totalAmount.toFixed(2)}`, {
          x: width - 150,
          y: yPosition,
          size: 12,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 40;
        
        // Payment Info
        page.drawText('Payment Information:', {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 20;
        page.drawText(`Payment ID: ${paymentOrder.razorpayPaymentId || 'N/A'}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
        page.drawText(`Order ID: ${paymentOrder.razorpayOrderId || 'N/A'}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
        page.drawText(`Status: ${paymentOrder.status.toUpperCase()}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= 40;
        
        // Footer
        page.drawText('Thank you for your business!', {
          x: centerText('Thank you for your business!', 8, helveticaFont),
          y: yPosition,
          size: 8,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
        yPosition -= 15;
        page.drawText('This is a computer-generated receipt.', {
          x: centerText('This is a computer-generated receipt.', 8, helveticaFont),
          y: yPosition,
          size: 8,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        // Generate PDF bytes
        const pdfBytes = await pdfDoc.save();
        const pdfBuffer = Buffer.from(pdfBytes);
        
        logger.log('✅ ReceiptService: PDF generated successfully using pdf-lib');

        // ✅ FIXED: Upload PDF to receipts bucket (private, uses signed URLs, no CDN)
        const fileName = `receipt_${invoice.invoiceNumber}_${Date.now()}.pdf`;
        const uploadResult = await StorageService.uploadFile(
          pdfBuffer,
          'receipts', // Use receipts bucket (private, no CDN)
          paymentOrder.userId,
          fileName,
          undefined, // No project slug for receipts
          'application/pdf' // Explicit content type
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
      } catch (error: any) {
        logger.error('❌ ReceiptService: Error generating receipt PDF:', {
          error: error.message,
          stack: error.stack
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate receipt PDF',
        };
      }
    } catch (error: any) {
      logger.error('❌ ReceiptService: Error generating receipt PDF:', {
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate receipt PDF',
      };
    }
  }

  /**
   * Send receipt email to user via Resend
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

      // Send receipt email via Resend
      const { sendPaymentReceiptEmail } = await import('@/lib/services/email.service');
      
      const emailResult = await sendPaymentReceiptEmail({
        name: user.name || 'User',
        email: user.email,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || 'INR',
        orderId: paymentOrder.id,
        receiptUrl: paymentOrder.receiptPdfUrl || undefined,
        paymentDate: paymentOrder.createdAt || new Date(),
        items: paymentOrder.referenceId ? [
          {
            name: paymentOrder.type === 'credit_package' ? 'Credit Package' : 'Subscription',
            quantity: 1,
            price: paymentOrder.amount,
          },
        ] : undefined,
      });

      if (!emailResult.success) {
        logger.error('❌ ReceiptService: Failed to send receipt email:', emailResult.error);
        // Continue anyway - receipt generation succeeded
      }

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

