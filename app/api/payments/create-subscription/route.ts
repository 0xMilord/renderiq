import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/services/razorpay.service';
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
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, error: result.error },
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

