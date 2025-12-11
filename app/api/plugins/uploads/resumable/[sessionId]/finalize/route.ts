import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';
import { finalizeResumableUpload } from '@/lib/services/resumable-upload';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * POST /api/plugins/uploads/resumable/[sessionId]/finalize
 * Finalize a resumable upload and get the final URL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const platform = detectPlatform(request);
    const { sessionId } = params;
    
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

    const result = await finalizeResumableUpload(sessionId);

    // Verify the upload belongs to the user
    const { getResumableUploadSession } = await import('@/lib/services/resumable-upload');
    const session = await getResumableUploadSession(sessionId);
    
    if (session && session.userId !== authResult.auth.user.id) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { reason: 'Session does not belong to user' }),
        { status: 403 }
      );
    }

    logger.log('✅ Plugin Resumable Upload: Finalized', {
      userId: authResult.auth.user.id,
      sessionId,
      filePath: result.key,
      platform: platform.platform,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        key: result.key,
      },
    });
  } catch (error) {
    logger.error('❌ Plugin Resumable Upload: Finalize error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.NOT_FOUND, { resource: 'upload session' }),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR, { details: errorMessage }),
      { status: 500 }
    );
  }
}

