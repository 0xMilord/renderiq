import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * POST /api/plugins/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const platform = detectPlatform(request);
    logger.log('🔄 Plugin Auth: Token refresh request', { platform: platform.platform });

    // Apply rate limiting (stricter for refresh requests)
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }

    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      securityLog('plugin_auth_refresh_missing_token', { platform: platform.platform }, 'warn');
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.MISSING_REQUIRED_FIELD, { field: 'refresh_token' }),
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Refresh the session using refresh token
    const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (refreshError || !sessionData.session) {
      securityLog('plugin_auth_refresh_failed', { 
        platform: platform.platform, 
        error: refreshError?.message 
      }, 'warn');
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.REFRESH_FAILED, { message: refreshError?.message }),
        { status: 401 }
      );
    }

    const session = sessionData.session;
    const accessToken = session.access_token;
    const expiresAt = new Date(session.expires_at! * 1000).toISOString();

    logger.log('✅ Plugin Auth: Token refreshed successfully', {
      userId: sessionData.user?.id,
      platform: platform.platform,
    });

    return NextResponse.json({
      success: true,
      access_token: accessToken,
      refresh_token: session.refresh_token, // New refresh token (may be rotated)
      expires_at: expiresAt,
      token_type: 'Bearer',
    });
  } catch (error) {
    logger.error('❌ Plugin Auth: Token refresh error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

