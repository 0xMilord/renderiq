import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { db } from '@/lib/db';
import { paymentOrders, creditPackages, subscriptionPlans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

/**
 * ✅ OPTIMIZED: Get payment order by Razorpay subscription ID
 * Uses LEFT JOIN to fetch all data in a single query
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    // ✅ FIXED: Next.js 15 requires awaiting params Promise
    const { subscriptionId } = await params;
    logger.log('📊 API: Getting payment order by subscription ID:', subscriptionId);

    const { user } = await getCachedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ✅ OPTIMIZED: Fetch payment with reference details using LEFT JOIN (single query)
    const [paymentWithDetails] = await db
      .select({
        payment: paymentOrders,
        package: creditPackages,
        plan: subscriptionPlans,
      })
      .from(paymentOrders)
      .leftJoin(
        creditPackages,
        and(
          eq(paymentOrders.referenceId, creditPackages.id),
          eq(paymentOrders.type, 'credit_package')
        )
      )
      .leftJoin(
        subscriptionPlans,
        and(
          eq(paymentOrders.referenceId, subscriptionPlans.id),
          eq(paymentOrders.type, 'subscription')
        )
      )
      .where(
        and(
          eq(paymentOrders.razorpaySubscriptionId, subscriptionId),
          eq(paymentOrders.userId, user.id) // Ensure user owns this payment
        )
      )
      .orderBy(paymentOrders.createdAt)
      .limit(1);

    if (!paymentWithDetails) {
      return NextResponse.json(
        { success: false, error: 'Payment order not found' },
        { status: 404 }
      );
    }

    // Format response with reference details
    const referenceDetails = paymentWithDetails.payment.type === 'credit_package' 
      ? paymentWithDetails.package 
      : paymentWithDetails.payment.type === 'subscription'
      ? paymentWithDetails.plan
      : null;

    const payment = {
      ...paymentWithDetails.payment,
      referenceDetails,
    };

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    logger.error('❌ API: Error getting payment order by subscription ID:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

