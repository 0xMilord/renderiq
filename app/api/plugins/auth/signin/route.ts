import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * POST /api/plugins/auth/signin
 * Authenticate user for plugin (all platforms)
 * Returns access token for Bearer authentication
 */
export async function POST(request: NextRequest) {
  try {
    const platform = detectPlatform(request);
    logger.log('🔐 Plugin Auth: Sign in request', { platform: platform.platform });

    // Apply rate limiting (auth endpoints have stricter limits)
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    // Prepare rate limit headers for response
    const rateLimitHeaders: Record<string, string> = {};
    if (rateLimit.rateLimitInfo) {
      rateLimitHeaders['X-RateLimit-Limit'] = String(rateLimit.rateLimitInfo.limit);
      rateLimitHeaders['X-RateLimit-Remaining'] = String(rateLimit.rateLimitInfo.remaining);
      rateLimitHeaders['X-RateLimit-Reset'] = String(rateLimit.rateLimitInfo.resetTime);
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      securityLog('plugin_auth_missing_credentials', { platform: platform.platform }, 'warn');
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.MISSING_REQUIRED_FIELD, { fields: ['email', 'password'] }),
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      securityLog('plugin_auth_failed', { email, platform: platform.platform, error: authError?.message }, 'warn');
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_CREDENTIALS),
        { status: 401 }
      );
    }

    // Get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      securityLog('plugin_session_failed', { email, platform: platform.platform, error: sessionError?.message }, 'warn');
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.AUTH_FAILED, { reason: 'Failed to create session' }),
        { status: 401 }
      );
    }

    const session = sessionData.session;
    const accessToken = session.access_token;

    // Calculate expiration (JWT tokens typically expire in 1 hour)
    const expiresAt = new Date(session.expires_at! * 1000).toISOString();

    logger.log('✅ Plugin Auth: User authenticated', {
      userId: authData.user.id,
      email: authData.user.email,
      platform: platform.platform,
    });

    return NextResponse.json({
      success: true,
      access_token: accessToken,
      refresh_token: session.refresh_token,
      expires_at: expiresAt,
      token_type: 'Bearer',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
      },
    }, {
      headers: rateLimitHeaders,
    });
  } catch (error) {
    logger.error('❌ Plugin Auth: Sign in error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

