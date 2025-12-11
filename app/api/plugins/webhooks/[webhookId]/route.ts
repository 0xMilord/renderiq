import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest, hasRequiredScope } from '@/lib/utils/plugin-auth';
import { WebhooksDAL } from '@/lib/dal/webhooks';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';
import { isValidUUID } from '@/lib/utils/security';

/**
 * DELETE /api/plugins/webhooks/[webhookId]
 * Unregister a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { webhookId: string } }
) {
  try {
    const platform = detectPlatform(request);
    const { webhookId } = params;
    
    // Apply rate limiting
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    if (!isValidUUID(webhookId)) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { field: 'webhookId' }),
        { status: 400 }
      );
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

    const deleted = await WebhooksDAL.delete(webhookId, authResult.auth.user.id);

    if (!deleted) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.NOT_FOUND, { resource: 'webhook' }),
        { status: 404 }
      );
    }

    logger.log('✅ Plugin Webhooks: Webhook unregistered', {
      userId: authResult.auth.user.id,
      webhookId,
      platform: platform.platform,
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook unregistered successfully',
    });
  } catch (error) {
    logger.error('❌ Plugin Webhooks: Delete error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

