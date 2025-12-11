import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest, hasRequiredScope } from '@/lib/utils/plugin-auth';
import { handleRenderRequest } from '@/app/api/renders/route';
import { detectPlatform, normalizePlatformForDB } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * POST /api/plugins/renders
 * Create render request from any plugin platform
 * Wraps the main render handler with Bearer token authentication
 * 
 * This endpoint accepts Bearer token authentication and converts it
 * to a format that the main render handler expects.
 */
export async function POST(request: NextRequest) {
  try {
    const platform = detectPlatform(request);
    logger.log('🎨 Plugin Render: Render request received', { platform: platform.platform });

    // Apply rate limiting (stricter for render requests)
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }

    // Authenticate request
    const authResult = await authenticatePluginRequest(request);
    
    if (!authResult.success) {
      securityLog('plugin_render_auth_failed', { platform: platform.platform }, 'warn');
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.AUTH_REQUIRED),
        { status: 401 }
      );
    }

    // Check scope if using API key
    if (!hasRequiredScope(authResult.auth, 'renders:create')) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { requiredScope: 'renders:create' }),
        { status: 403 }
      );
    }

    logger.log('✅ Plugin Render: Render request authenticated', {
      userId: authResult.auth.user.id,
      authType: authResult.auth.authType,
      platform: platform.platform,
    });

    // Get form data from the original request
    const formData = await request.formData();
    
    // Add platform information and telemetry to form data
    formData.append('platform', normalizePlatformForDB(platform.platform));
    formData.append('sourcePlatform', platform.platform);
    if (platform.version) {
      formData.append('pluginVersion', platform.version);
    }
    
    // Add user agent for telemetry
    const userAgent = request.headers.get('user-agent') || '';
    formData.append('userAgent', userAgent);
    
    // Get callback URL for webhooks if provided
    const callbackUrl = formData.get('callback_url') as string | null;
    
    // If callback URL provided, register a temporary webhook
    if (callbackUrl) {
      try {
        const { WebhooksDAL } = await import('@/lib/dal/webhooks');
        await WebhooksDAL.create({
          userId: authResult.auth.user.id,
          url: callbackUrl as string,
          events: ['render.completed', 'render.failed'],
        });
        logger.log('✅ Plugin Render: Temporary webhook registered', { callbackUrl });
      } catch (webhookError) {
        logger.warn('⚠️ Plugin Render: Failed to register webhook', { error: webhookError });
        // Don't fail the request if webhook registration fails
      }
    }
    
    // Create a new request with the Bearer token in headers
    // handleRenderRequest will extract it via getCachedUser(bearerToken)
    const url = new URL(request.url.replace('/api/plugins/renders', '/api/renders'));
    
    // Create new FormData from the modified formData
    const modifiedFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        modifiedFormData.append(key, value);
      } else {
        modifiedFormData.append(key, value as string);
      }
    }
    
    const modifiedRequest = new NextRequest(url, {
      method: 'POST',
      headers: request.headers, // Includes Authorization: Bearer <token>
      body: modifiedFormData,
    });

    // Call the main render handler - it now supports Bearer tokens
    return await handleRenderRequest(modifiedRequest);
    
  } catch (error) {
    logger.error('❌ Plugin Render: Render error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

