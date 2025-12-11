import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';
import { BillingDAL } from '@/lib/dal/billing';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * GET /api/plugins/auth/me
 * Get current user info from Bearer token (all platforms)
 */
export async function GET(request: NextRequest) {
  try {
    const platform = detectPlatform(request);
    
    // Apply rate limiting
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    // Authenticate request
    const authResult = await authenticatePluginRequest(request);
    
    if (!authResult.success) {
      securityLog('plugin_auth_missing_token', { platform: platform.platform }, 'warn');
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.AUTH_REQUIRED),
        { status: 401 }
      );
    }

    const user = authResult.auth.user;

    // Get credit balance
    let credits = null;
    try {
      const creditData = await BillingDAL.getUserCreditsWithResetAndMonthly(user.id);
      if (creditData) {
        credits = {
          balance: creditData.balance,
          totalEarned: creditData.totalEarned,
          totalSpent: creditData.totalSpent,
          monthlyEarned: creditData.monthlyEarned || 0,
          monthlySpent: creditData.monthlySpent || 0,
        };
      }
    } catch (creditError) {
      logger.warn('⚠️ Plugin Auth: Failed to get credits', { error: creditError });
      // Don't fail the request if credits fetch fails
    }

    logger.log('✅ Plugin Auth: User info retrieved', {
      userId: user.id,
      email: user.email,
      platform: platform.platform,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        created_at: user.created_at,
        credits,
      },
    });
  } catch (error) {
    logger.error('❌ Plugin Auth: Get user error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

