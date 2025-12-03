import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    logger.log('🚫 API: Cancelling subscription');

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Cancel the subscription
    const result = await RazorpayService.cancelPendingSubscription(subscriptionId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to cancel subscription' },
        { status: 400 }
      );
    }

    logger.log('✅ API: Subscription cancelled successfully');

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error('❌ API: Error cancelling subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

