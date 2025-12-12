import { NextRequest, NextResponse } from 'next/server';
import { PaymentProviderFactory } from '@/lib/services/payment-provider.factory';
import { logger } from '@/lib/utils/logger';
import { checkDuplicatePayment } from '@/lib/utils/payment-security';
import { withAuthenticatedApiRoute } from '@/lib/middleware/api-route';
import * as Sentry from '@sentry/nextjs';

export const POST = withAuthenticatedApiRoute(
  async ({ request, user }) => {
    logger.log('🔐 API: Verifying payment');

    const body = await request.json();
    
    // Support both Razorpay and Paddle verification
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      paddle_transaction_id,
      provider 
    } = body;

    // Determine provider from request or detect
    let paymentProvider;
    let verificationData: any;

    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      // Razorpay payment
      paymentProvider = PaymentProviderFactory.getProviderByType('razorpay');
      verificationData = {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      };

      // Check for duplicate payment (Razorpay)
      const duplicateCheck = await checkDuplicatePayment(razorpay_order_id, razorpay_payment_id);
      if (duplicateCheck.isDuplicate) {
        logger.warn('⚠️ API: Duplicate payment attempt detected:', {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          existingOrderId: duplicateCheck.existingOrderId,
        });
        
        Sentry.captureMessage('Duplicate payment attempt detected', {
          level: 'warning',
          tags: {
            payment_security: true,
            duplicate_payment: true,
          },
          extra: {
            razorpayOrderId: razorpay_order_id,
            existingOrderId: duplicateCheck.existingOrderId,
          },
        });
        
        return NextResponse.json(
          { success: false, error: 'This payment has already been processed' },
          { status: 400 }
        );
      }
    } else if (paddle_transaction_id) {
      // Paddle payment
      paymentProvider = PaymentProviderFactory.getProviderByType('paddle');
      verificationData = {
        transactionId: paddle_transaction_id,
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification data' },
        { status: 400 }
      );
    }

    // Verify payment using appropriate provider
    const verifyResult = await paymentProvider.verifyPayment(verificationData);

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

    logger.log('✅ API: Payment verified successfully');

    return NextResponse.json({
      success: true,
      data: {
        paymentOrderId: verifyResult.data?.paymentOrderId,
        creditsAdded: verifyResult.data?.type === 'credit_package',
      },
    });
  },
  {
    routeName: 'POST /api/payments/verify-payment',
    enableCORS: true,
    enableRateLimit: false, // Payment verification should not be rate limited
    onError: (error, request) => {
      logger.error('❌ API: Error verifying payment:', error);
      Sentry.setContext('payment_verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null; // Use default error handler
    }
  }
);
