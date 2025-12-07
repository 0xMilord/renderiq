import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { ReceiptService } from '@/lib/services/receipt.service';
import { db } from '@/lib/db';
import { paymentOrders } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

// Force Node.js runtime for pdfkit (requires Node.js APIs)
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logger.log('🧾 API: Getting receipt for payment order:', id);

    const { user } = await getCachedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if id is a UUID (payment order ID) or Razorpay subscription ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let paymentOrder;
    let paymentOrderId: string;
    
    if (isUUID) {
      // It's a payment order ID
      const [order] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, id))
        .limit(1);
      paymentOrder = order;
      paymentOrderId = id;
    } else if (id.startsWith('sub_')) {
      // It's a Razorpay subscription ID - find the most recent payment order for this subscription
      const [order] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.razorpaySubscriptionId, id))
        .orderBy(desc(paymentOrders.createdAt))
        .limit(1);
      paymentOrder = order;
      paymentOrderId = order?.id || '';
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid payment order or subscription ID' },
        { status: 400 }
      );
    }

    if (!paymentOrder) {
      return NextResponse.json(
        { success: false, error: 'Payment order not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (paymentOrder.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Generate receipt if not already generated
    if (!paymentOrder.receiptPdfUrl) {
      const receiptResult = await ReceiptService.generateReceiptPdf(paymentOrderId);
      if (!receiptResult.success) {
        return NextResponse.json(
          { success: false, error: receiptResult.error },
          { status: 500 }
        );
      }
    }

    // Get updated payment order with receipt URL
    const [updatedOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, paymentOrderId))
      .limit(1);

    if (!updatedOrder?.receiptPdfUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate receipt' },
        { status: 500 }
      );
    }

    // Check if download query parameter is present
    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    if (download) {
      // Stream the PDF file directly for download
      try {
        const pdfResponse = await fetch(updatedOrder.receiptPdfUrl);
        if (!pdfResponse.ok) {
          return NextResponse.json(
            { success: false, error: 'Failed to fetch PDF' },
            { status: 500 }
          );
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        const fileName = `receipt_${updatedOrder.invoiceNumber || id}.pdf`;

        // Force download by using attachment and proper filename encoding
        const encodedFileName = encodeURIComponent(fileName);
        
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`,
            'Content-Length': pdfBuffer.byteLength.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
      } catch (error) {
        logger.error('❌ API: Error streaming PDF:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to stream PDF' },
          { status: 500 }
        );
      }
    }

    // Return receipt URL
    return NextResponse.json({
      success: true,
      data: {
        receiptUrl: updatedOrder.receiptPdfUrl,
        invoiceNumber: updatedOrder.invoiceNumber,
      },
    });
  } catch (error) {
    logger.error('❌ API: Error getting receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logger.log('🧾 API: Generating receipt for payment order:', id);

    const { user } = await getCachedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if id is a UUID (payment order ID) or Razorpay subscription ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let paymentOrder;
    let paymentOrderId: string;
    
    if (isUUID) {
      // It's a payment order ID
      const [order] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, id))
        .limit(1);
      paymentOrder = order;
      paymentOrderId = id;
    } else if (id.startsWith('sub_')) {
      // It's a Razorpay subscription ID - find the most recent payment order for this subscription
      const [order] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.razorpaySubscriptionId, id))
        .orderBy(desc(paymentOrders.createdAt))
        .limit(1);
      paymentOrder = order;
      paymentOrderId = order?.id || '';
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid payment order or subscription ID' },
        { status: 400 }
      );
    }

    if (!paymentOrder) {
      return NextResponse.json(
        { success: false, error: 'Payment order not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (paymentOrder.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Generate receipt
    const receiptResult = await ReceiptService.generateReceiptPdf(paymentOrderId);

    if (!receiptResult.success) {
      return NextResponse.json(
        { success: false, error: receiptResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        receiptUrl: receiptResult.pdfUrl,
      },
    });
  } catch (error) {
    logger.error('❌ API: Error generating receipt:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


