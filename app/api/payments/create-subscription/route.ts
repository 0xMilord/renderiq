import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { BillingDAL } from '@/lib/dal/billing';
import { logger } from '@/lib/utils/logger';
import { db } from '@/lib/db';
import { userSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Helper to get Razorpay instance (same as RazorpayService)
function getRazorpayInstance() {
  const Razorpay = require('razorpay');
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }
  
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function POST(request: NextRequest) {
  try {
    logger.log('💳 API: Creating Razorpay subscription');

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, upgrade = false } = body;

    logger.log('📥 API: Received subscription request:', {
      planId,
      upgrade,
      userId: user.id,
    });

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // CRITICAL: Check for existing active or pending subscription
    const existingSubscription = await BillingDAL.getUserSubscription(user.id);
    
    if (existingSubscription) {
      const isActive = existingSubscription.subscription.status === 'active';
      const isPending = existingSubscription.subscription.status === 'pending';
      const isDifferentPlan = existingSubscription.subscription.planId !== planId;
      
      logger.log('🔍 API: Existing subscription check:', {
        isActive,
        isPending,
        isDifferentPlan,
        existingPlanId: existingSubscription.subscription.planId,
        newPlanId: planId,
        upgrade,
      });
      
      // If user already has active subscription and not upgrading
      if (isActive && !upgrade && !isDifferentPlan) {
        // Only block if it's the same plan
        logger.warn('⚠️ API: User trying to subscribe to same plan:', {
          userId: user.id,
          planId,
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'You are already subscribed to this plan.',
            hasExistingSubscription: true,
            existingSubscription: {
              planId: existingSubscription.subscription.planId,
              planName: existingSubscription.plan?.name,
              status: existingSubscription.subscription.status,
            },
          },
          { status: 400 }
        );
      }
      
      // If user has active subscription and selecting different plan, treat as upgrade/downgrade
      if (isActive && isDifferentPlan && !upgrade) {
        logger.log('🔄 API: Detected plan change but upgrade flag not set, treating as upgrade');
        // Continue to upgrade logic below
      }
      
      // If user has pending subscription, don't allow new one (unless upgrading)
      if (isPending && !upgrade) {
        logger.warn('⚠️ API: User has pending subscription:', {
          userId: user.id,
          existingPlanId: existingSubscription.subscription.planId,
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'You have a pending subscription. Please wait for the payment to complete or cancel it first.',
            hasPendingSubscription: true,
            existingSubscription: {
              planId: existingSubscription.subscription.planId,
              planName: existingSubscription.plan?.name,
              status: existingSubscription.subscription.status,
            },
          },
          { status: 400 }
        );
      }
      
      // If user has active subscription and selecting different plan, treat as upgrade/downgrade
      // Auto-detect upgrade if upgrade flag is not set but plan is different
      const shouldUpgrade = upgrade || (isActive && isDifferentPlan);
      
      // If user already has active subscription and selecting same plan, block it
      if (isActive && !isDifferentPlan && !upgrade) {
        logger.warn('⚠️ API: User trying to subscribe to same plan:', {
          userId: user.id,
          planId,
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'You are already subscribed to this plan.',
            hasExistingSubscription: true,
            existingSubscription: {
              planId: existingSubscription.subscription.planId,
              planName: existingSubscription.plan?.name,
              status: existingSubscription.subscription.status,
            },
          },
          { status: 400 }
        );
      }
      
      // If upgrading/downgrading (or auto-detected plan change), cancel old subscription first
      if (shouldUpgrade && isActive) {
        logger.log('🔄 API: Upgrading/downgrading subscription - cancelling old one');
        
        // Cancel old subscription in Razorpay
        if (existingSubscription.subscription.razorpaySubscriptionId) {
          try {
            const razorpay = getRazorpayInstance();
              
            // Cancel the old subscription in Razorpay
            await razorpay.subscriptions.cancel(existingSubscription.subscription.razorpaySubscriptionId);
            logger.log('✅ API: Old subscription cancelled in Razorpay');
          } catch (error: any) {
            logger.warn('⚠️ API: Could not cancel old subscription in Razorpay (may already be cancelled):', error.message);
            // Continue with upgrade even if cancellation fails
          }
        }
        
        // Mark old subscription as canceled in database
        await db
          .update(userSubscriptions)
          .set({
            status: 'canceled',
            cancelAtPeriodEnd: false,
            canceledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.id, existingSubscription.subscription.id));
        
        logger.log('✅ API: Old subscription marked as canceled in database');
        // Continue to create new subscription below
      }
    }

    // Get user details
    const { data: { user: userData } } = await supabase.auth.getUser();
    
    if (!userData?.email) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      );
    }

    // Create subscription
    const result = await RazorpayService.createSubscription(
      user.id,
      planId,
      {
        name: userData.user_metadata?.name || userData.email.split('@')[0],
        email: userData.email,
      }
    );

    if (!result.success) {
      // Provide more detailed error response
      const errorMessage = result.error || 'Failed to create subscription';
      
      // Check if it's the subscriptions not enabled error
      const isSubscriptionsNotEnabled = errorMessage.includes('Subscriptions Feature Not Enabled') || 
                                        errorMessage.includes('not enabled');
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          requiresRazorpaySupport: isSubscriptionsNotEnabled,
          errorType: isSubscriptionsNotEnabled ? 'SUBSCRIPTIONS_NOT_ENABLED' : 'OTHER'
        },
        { status: 400 }
      );
    }

    logger.log('✅ API: Subscription created successfully:', result.data?.subscriptionId);

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('❌ API: Error creating subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

