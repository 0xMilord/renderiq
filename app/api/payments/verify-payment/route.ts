import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    logger.log('🔐 API: Verifying Razorpay payment');

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification data' },
        { status: 400 }
      );
    }

    // Verify payment
    const verifyResult = await RazorpayService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
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

    // Add credits if this is a credit package purchase
    if (verifyResult.data?.type === 'credit_package' && verifyResult.data?.referenceId) {
      const creditsResult = await RazorpayService.addCreditsToAccount(
        user.id,
        verifyResult.data.referenceId
      );

      if (!creditsResult.success) {
        logger.error('❌ API: Error adding credits after payment:', creditsResult.error);
        // Payment is verified, but credits failed - this should be handled by webhook
      }
    }

    logger.log('✅ API: Payment verified successfully');

    return NextResponse.json({
      success: true,
      data: {
        paymentOrderId: verifyResult.data?.paymentOrderId,
        creditsAdded: verifyResult.data?.type === 'credit_package',
      },
    });
  } catch (error) {
    logger.error('❌ API: Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

