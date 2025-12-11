import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest, hasRequiredScope } from '@/lib/utils/plugin-auth';
import { WebhooksDAL } from '@/lib/dal/webhooks';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { securityLog } from '@/lib/utils/security';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * POST /api/plugins/webhooks/register
 * Register a webhook for receiving render status updates
 */
export async function POST(request: NextRequest) {
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

    // Check scope if using API key
    if (!hasRequiredScope(authResult.auth, 'webhook:write')) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { requiredScope: 'webhook:write' }),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url, events, secret } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.MISSING_REQUIRED_FIELD, { field: 'url' }),
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { field: 'url', reason: 'Invalid URL format' }),
        { status: 400 }
      );
    }

    // URL must be HTTPS (except localhost for development)
    if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { field: 'url', reason: 'Must use HTTPS (or localhost)' }),
        { status: 400 }
      );
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.MISSING_REQUIRED_FIELD, { field: 'events' }),
        { status: 400 }
      );
    }

    // Validate events
    const validEvents = ['render.completed', 'render.failed', 'render.processing'];
    const invalidEvents = events.filter(e => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { field: 'events', invalidEvents }),
        { status: 400 }
      );
    }

    const webhook = await WebhooksDAL.create({
      userId: authResult.auth.user.id,
      url,
      events,
      secret,
    });

    logger.log('✅ Plugin Webhooks: Webhook registered', {
      userId: authResult.auth.user.id,
      webhookId: webhook.id,
      url,
      platform: platform.platform,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          webhookId: webhook.id,
          url: webhook.url,
          secret: webhook.secret, // Return secret for HMAC verification
          events: webhook.events,
          createdAt: webhook.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('❌ Plugin Webhooks: Register error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

