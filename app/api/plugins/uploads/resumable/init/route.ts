import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest, hasRequiredScope } from '@/lib/utils/plugin-auth';
import { initResumableUpload } from '@/lib/services/resumable-upload';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * POST /api/plugins/uploads/resumable/init
 * Initialize a resumable upload session
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
    if (!hasRequiredScope(authResult.auth, 'renders:create')) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { requiredScope: 'renders:create' }),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileName, contentType, totalSize, bucket, projectSlug } = body;

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.MISSING_REQUIRED_FIELD, { field: 'fileName' }),
        { status: 400 }
      );
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.MISSING_REQUIRED_FIELD, { field: 'contentType' }),
        { status: 400 }
      );
    }

    if (!totalSize || typeof totalSize !== 'number' || totalSize <= 0) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { field: 'totalSize', reason: 'Must be a positive number' }),
        { status: 400 }
      );
    }

    // Validate file size (max 5GB for resumable uploads)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    if (totalSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { field: 'totalSize', reason: `File size exceeds maximum of ${MAX_FILE_SIZE} bytes` }),
        { status: 400 }
      );
    }

    const session = await initResumableUpload(
      authResult.auth.user.id,
      fileName,
      contentType,
      totalSize,
      bucket || 'uploads',
      projectSlug
    );

    logger.log('✅ Plugin Resumable Upload: Session initialized', {
      userId: authResult.auth.user.id,
      sessionId: session.sessionId,
      fileName,
      totalSize,
      platform: platform.platform,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        uploadUrl: session.uploadUrl,
        expiresAt: session.expiresAt.toISOString(),
        bucket: session.bucket,
        filePath: session.filePath,
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('❌ Plugin Resumable Upload: Init error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

