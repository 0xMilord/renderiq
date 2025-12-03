import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { BillingDAL } from '@/lib/dal/billing';
import { logger } from '@/lib/utils/logger';

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
      
      // If user already has active subscription and not upgrading
      if (isActive && !upgrade) {
        logger.warn('⚠️ API: User already has active subscription:', {
          userId: user.id,
          existingPlanId: existingSubscription.subscription.planId,
          newPlanId: planId,
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'You already have an active subscription. Please cancel your current subscription or upgrade to a different plan.',
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
      
      // If user has pending subscription, don't allow new one
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
      
      // If upgrading, cancel old subscription first
      if (upgrade && isActive) {
        logger.log('🔄 API: Upgrading subscription - cancelling old one');
        // TODO: Implement proper upgrade logic (cancel old, create new, handle prorating)
        // For now, return error asking user to cancel first
        return NextResponse.json(
          { 
            success: false, 
            error: 'Subscription upgrades are not yet supported. Please cancel your current subscription first, then subscribe to the new plan.',
            requiresCancellation: true,
            existingSubscription: {
              planId: existingSubscription.subscription.planId,
              planName: existingSubscription.plan?.name,
              razorpaySubscriptionId: existingSubscription.subscription.razorpaySubscriptionId,
            },
          },
          { status: 400 }
        );
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

