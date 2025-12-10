import { NextRequest, NextResponse } from 'next/server';
import { getCachedUser } from '@/lib/services/auth-cache';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { logger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/payment-security';
import { convertCurrency, getRazorpayCurrencyCode, SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    logger.log('💳 API: Creating Razorpay order');

    const { user } = await getCachedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { creditPackageId, currency: requestedCurrency } = body;

    if (!creditPackageId) {
      return NextResponse.json(
        { success: false, error: 'Credit package ID is required' },
        { status: 400 }
      );
    }

    // Validate currency
    let currency = requestedCurrency && SUPPORTED_CURRENCIES[requestedCurrency]
      ? getRazorpayCurrencyCode(requestedCurrency)
      : 'INR'; // Default to INR

    // Get credit package details to calculate amount
    const { db } = await import('@/lib/db');
    const { creditPackages } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const [packageData] = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.id, creditPackageId))
      .limit(1);

    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Credit package not found' },
        { status: 404 }
      );
    }

    if (!packageData.isActive) {
      return NextResponse.json(
        { success: false, error: 'Credit package is not available' },
        { status: 400 }
      );
    }

    // Convert price if currency is different
    let orderAmount = parseFloat(packageData.price);
    if (currency !== 'INR' && packageData.currency === 'INR') {
      // Convert from INR to target currency
      orderAmount = await convertCurrency(orderAmount, currency);
      
      // Ensure minimum amount after conversion
      const minimumAmounts: Record<string, number> = {
        INR: 1.00, USD: 0.01, EUR: 0.01, GBP: 0.01, JPY: 1,
        AUD: 0.01, CAD: 0.01, SGD: 0.01, AED: 0.01, SAR: 0.01,
      };
      const minimumAmount = minimumAmounts[currency] || 0.01;
      
      if (orderAmount < minimumAmount) {
        logger.log(`⚠️ API: Converted amount ${orderAmount} ${currency} is below minimum ${minimumAmount}, using INR instead`);
        // Revert to INR if converted amount is too small
        orderAmount = parseFloat(packageData.price);
        currency = 'INR';
      }
    }

    // Create Razorpay order
    const result = await RazorpayService.createOrder(
      user.id,
      creditPackageId,
      orderAmount,
      currency
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    logger.log('✅ API: Order created successfully:', result.data?.orderId);

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('❌ API: Error creating order:', error);
    
    // Add Sentry context for payment errors
    Sentry.setContext('payment_create_order', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

