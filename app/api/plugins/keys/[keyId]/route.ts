import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';
import { ApiKeysDAL } from '@/lib/dal/api-keys';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';
import { isValidUUID } from '@/lib/utils/security';

/**
 * DELETE /api/plugins/keys/[keyId]
 * Revoke an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const platform = detectPlatform(request);
    const { keyId } = params;
    
    // Apply rate limiting
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    if (!isValidUUID(keyId)) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { field: 'keyId' }),
        { status: 400 }
      );
    }
    
    // Must use Bearer token to revoke API keys
    const authResult = await authenticatePluginRequest(request);
    
    if (!authResult.success || authResult.auth.authType !== 'bearer') {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.AUTH_REQUIRED),
        { status: 401 }
      );
    }

    const revoked = await ApiKeysDAL.revoke(keyId, authResult.auth.user.id);

    if (!revoked) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.NOT_FOUND, { resource: 'API key' }),
        { status: 404 }
      );
    }

    logger.log('✅ Plugin API Keys: API key revoked', {
      userId: authResult.auth.user.id,
      keyId,
      platform: platform.platform,
    });

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    logger.error('❌ Plugin API Keys: Revoke error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

