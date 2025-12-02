import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ReceiptService } from '@/lib/services/receipt.service';
import { db } from '@/lib/db';
import { paymentOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

// Force Node.js runtime for pdfkit (requires Node.js APIs)
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.log('🧾 API: Getting receipt for payment order:', params.id);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get payment order
    const [paymentOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, params.id))
      .limit(1);

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
      const receiptResult = await ReceiptService.generateReceiptPdf(params.id);
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
      .where(eq(paymentOrders.id, params.id))
      .limit(1);

    if (!updatedOrder?.receiptPdfUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate receipt' },
        { status: 500 }
      );
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
  { params }: { params: { id: string } }
) {
  try {
    logger.log('🧾 API: Generating receipt for payment order:', params.id);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get payment order
    const [paymentOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, params.id))
      .limit(1);

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
    const receiptResult = await ReceiptService.generateReceiptPdf(params.id);

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


