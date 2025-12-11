import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';
import { getResumableUploadSession } from '@/lib/services/resumable-upload';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * GET /api/plugins/uploads/resumable/[sessionId]/status
 * Get resumable upload session status
 */
export async function GET(
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

    const session = await getResumableUploadSession(sessionId);

    if (!session) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.NOT_FOUND, { resource: 'upload session' }),
        { status: 404 }
      );
    }

    // Verify session belongs to user
    if (session.userId !== authResult.auth.user.id) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { reason: 'Session does not belong to user' }),
        { status: 403 }
      );
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { reason: 'Session has expired' }),
        { status: 400 }
      );
    }

    const progress = session.totalSize > 0
      ? Math.round((session.uploadedBytes / session.totalSize) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        totalSize: session.totalSize,
        uploadedBytes: session.uploadedBytes,
        progress,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('❌ Plugin Resumable Upload: Get status error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

