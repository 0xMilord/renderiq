import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { db } from '@/lib/db';
import { paymentOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    logger.log('🚫 API: Cancelling payment order');

    const { user } = await getCachedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId, paymentOrderId } = body;

    if (!orderId && !paymentOrderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID or Payment Order ID is required' },
        { status: 400 }
      );
    }

    // Find the payment order
    let paymentOrder;
    if (paymentOrderId) {
      [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, paymentOrderId))
        .limit(1);
    } else if (orderId) {
      [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.razorpayOrderId, orderId))
        .limit(1);
    }

    if (!paymentOrder) {
      return NextResponse.json(
        { success: false, error: 'Payment order not found' },
        { status: 404 }
      );
    }

    // Verify the order belongs to the user
    if (paymentOrder.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Only cancel if status is pending (not already completed/failed/cancelled)
    if (paymentOrder.status === 'pending') {
      // Update database status to cancelled
      await db
        .update(paymentOrders)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, paymentOrder.id));

      logger.log('✅ API: Payment order cancelled successfully');
      return NextResponse.json({
        success: true,
      });
    } else {
      logger.log('⚠️ API: Payment order is not pending, cannot cancel:', paymentOrder.status);
      return NextResponse.json(
        { success: false, error: `Payment order is ${paymentOrder.status}, cannot cancel` },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('❌ API: Error cancelling payment order:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

