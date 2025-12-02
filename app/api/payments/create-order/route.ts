import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    logger.log('💳 API: Creating Razorpay order');

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { creditPackageId } = body;

    if (!creditPackageId) {
      return NextResponse.json(
        { success: false, error: 'Credit package ID is required' },
        { status: 400 }
      );
    }

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

    // Create Razorpay order
    const result = await RazorpayService.createOrder(
      user.id,
      creditPackageId,
      parseFloat(packageData.price),
      packageData.currency
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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

