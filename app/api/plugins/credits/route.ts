import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';
import { BillingDAL } from '@/lib/dal/billing';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * GET /api/plugins/credits
 * Get user's credit balance (all platforms)
 */
export async function GET(request: NextRequest) {
  try {
    const platform = detectPlatform(request);
    
    // Apply rate limiting
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    const authResult = await authenticatePluginRequest(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.AUTH_REQUIRED),
        { status: 401 }
      );
    }

    // Get credit balance
    const credits = await BillingDAL.getUserCreditsWithResetAndMonthly(authResult.auth.user.id);

    if (!credits) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.NOT_FOUND, { resource: 'credits' }),
        { status: 404 }
      );
    }

    logger.log('✅ Plugin Credits: Credit balance retrieved', {
      userId: authResult.auth.user.id,
      balance: credits.balance,
      platform: platform.platform,
    });

    return NextResponse.json({
      success: true,
      data: {
        balance: credits.balance,
        totalEarned: credits.totalEarned,
        totalSpent: credits.totalSpent,
        monthlyEarned: credits.monthlyEarned || 0,
        monthlySpent: credits.monthlySpent || 0,
      },
    });
  } catch (error) {
    logger.error('❌ Plugin Credits: Get credits error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

