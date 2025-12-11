import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest, hasRequiredScope } from '@/lib/utils/plugin-auth';
import { RendersDAL } from '@/lib/dal/renders';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';
import { isValidUUID } from '@/lib/utils/security';

/**
 * GET /api/plugins/renders/[renderId]
 * Get render status and result
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { renderId: string } }
) {
  try {
    const platform = detectPlatform(request);
    const { renderId } = params;
    
    // Apply rate limiting (more lenient for status checks)
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    if (!isValidUUID(renderId)) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { field: 'renderId' }),
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
    if (!hasRequiredScope(authResult.auth, 'renders:read')) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { requiredScope: 'renders:read' }),
        { status: 403 }
      );
    }

    const render = await RendersDAL.getById(renderId);

    if (!render) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.NOT_FOUND, { resource: 'render' }),
        { status: 404 }
      );
    }

    // Verify render belongs to user
    if (render.userId !== authResult.auth.user.id) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { reason: 'Render does not belong to user' }),
        { status: 403 }
      );
    }

    // Calculate progress if processing
    let progress: number | undefined;
    let estimatedTimeRemaining: number | undefined;

    if (render.status === 'processing') {
      // Estimate progress based on time elapsed vs estimated time
      // This is a rough estimate - in production, you'd track actual progress
      if (render.startedAt) {
        const elapsed = (Date.now() - render.startedAt.getTime()) / 1000; // seconds
        const estimatedTotal = render.estimatedCompletionAt
          ? (render.estimatedCompletionAt.getTime() - render.startedAt.getTime()) / 1000
          : 30; // Default 30 seconds
        
        progress = Math.min(Math.floor((elapsed / estimatedTotal) * 100), 95); // Cap at 95% until complete
        estimatedTimeRemaining = Math.max(0, Math.floor(estimatedTotal - elapsed));
      } else {
        progress = 0;
        estimatedTimeRemaining = 30;
      }
    }

    const responseData: any = {
      renderId: render.id,
      status: render.status,
      ...(progress !== undefined && { progress }),
      ...(estimatedTimeRemaining !== undefined && { estimatedTimeRemaining }),
      ...(render.outputUrl && { outputUrl: render.outputUrl }),
      ...(render.errorMessage && { error: render.errorMessage }),
      ...(render.processingTime && { processingTime: render.processingTime }),
      ...(render.creditsCost && { creditsUsed: render.creditsCost }),
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    logger.error('❌ Plugin Renders: Get status error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

