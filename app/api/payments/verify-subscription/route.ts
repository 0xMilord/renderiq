import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { logger } from '@/lib/utils/logger';
import { db } from '@/lib/db';
import { userSubscriptions, subscriptionPlans, userCredits } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    logger.log('🔐 API: Verifying Razorpay subscription payment');

    const { user } = await getCachedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId, paymentId, signature } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // If paymentId and signature are provided, use proper verification (like credit packages)
    if (paymentId && signature) {
      logger.log('🔐 API: Verifying subscription payment with signature');
      
      const verifyResult = await RazorpayService.verifySubscriptionPayment(
        subscriptionId,
        paymentId,
        signature
      );

      if (!verifyResult.success) {
        return NextResponse.json(
          { success: false, error: verifyResult.error },
          { status: 400 }
        );
      }

      // Check if payment order belongs to the user
      if (verifyResult.data?.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Get subscription to check if credits were added
      const [subscription] = await db
        .select({
          subscription: userSubscriptions,
          plan: subscriptionPlans,
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId))
        .limit(1);

      // Get user credits to show new balance
      const [userCredit] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, user.id))
        .limit(1);

      logger.log('✅ API: Subscription payment verified and activated');
      return NextResponse.json({
        success: true,
        data: {
          activated: true,
          creditsAdded: verifyResult.data?.creditsAdded || false,
          newBalance: verifyResult.data?.newBalance || userCredit?.balance || 0,
          paymentOrderId: verifyResult.data?.paymentOrderId,
        },
      });
    }

    // Fallback: If no paymentId/signature, check subscription status (old method)
    logger.log('⚠️ API: No payment ID/signature provided, using fallback verification');

    // Find subscription in database
    const [subscription] = await db
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId))
      .limit(1);

    if (!subscription || !subscription.subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if subscription belongs to user
    if (subscription.subscription.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch subscription status from Razorpay
    try {
      // Use the same Razorpay instance getter as RazorpayService
      const Razorpay = require('razorpay');
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials not configured');
      }

      const razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const razorpaySubscription = await razorpayInstance.subscriptions.fetch(subscriptionId);
      logger.log('📊 API: Subscription status from Razorpay:', razorpaySubscription.status);

      // If subscription is active in Razorpay but not in our database, activate it
      if (razorpaySubscription.status === 'active' && subscription.subscription.status !== 'active') {
        logger.log('✅ API: Subscription is active in Razorpay, activating in database');

        // Calculate period dates
        const now = new Date();
        const periodEnd = new Date(now);
        if (subscription.plan?.interval === 'year') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Update subscription to active
        await db
          .update(userSubscriptions)
          .set({
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.id, subscription.subscription.id));

        // ✅ REMOVED: Credit addition - credits are added by verifySubscriptionPayment(), not in fallback route
        // This fallback route should only activate subscription, credits are handled by proper verification
        logger.log('✅ API: Subscription activated (credits will be added via proper verification)');
        return NextResponse.json({
          success: true,
          data: {
            activated: true,
            creditsAdded: false,
            message: 'Subscription activated. Please use proper payment verification to add credits.',
          },
        });
      } else if (subscription.subscription.status === 'active') {
        logger.log('✅ API: Subscription already active');
        return NextResponse.json({
          success: true,
          data: {
            activated: false,
            alreadyActive: true,
          },
        });
      } else {
        logger.log('⚠️ API: Subscription not yet active in Razorpay, status:', razorpaySubscription.status);
        return NextResponse.json({
          success: true,
          data: {
            activated: false,
            status: razorpaySubscription.status,
            message: 'Payment is still processing. Credits will be added when payment is confirmed.',
          },
        });
      }
    } catch (error: any) {
      logger.error('❌ API: Error verifying subscription:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to verify subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { activated: false },
    });
  } catch (error: any) {
    logger.error('❌ API: Error verifying subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

