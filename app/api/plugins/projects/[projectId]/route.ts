import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest, hasRequiredScope } from '@/lib/utils/plugin-auth';
import { ProjectsDAL } from '@/lib/dal/projects';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { isValidUUID } from '@/lib/utils/security';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * GET /api/plugins/projects/[projectId]
 * Get project details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const platform = detectPlatform(request);
    const { projectId } = params;
    
    // Apply rate limiting
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    if (!isValidUUID(projectId)) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { field: 'projectId' }),
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
    if (!hasRequiredScope(authResult.auth, 'projects:read')) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { requiredScope: 'projects:read' }),
        { status: 403 }
      );
    }

    const project = await ProjectsDAL.getById(projectId);

    if (!project) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.NOT_FOUND, { resource: 'project' }),
        { status: 404 }
      );
    }

    // Verify project belongs to user
    if (project.userId !== authResult.auth.user.id) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { reason: 'Project does not belong to user' }),
        { status: 403 }
      );
    }

    // Get render count
    const { RendersDAL } = await import('@/lib/dal/renders');
    const renders = await RendersDAL.getByProjectId(projectId);

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        renderCount: renders.length,
        platform: (project.metadata as any)?.sourcePlatform || platform.platform,
      },
    });
  } catch (error) {
    logger.error('❌ Plugin Projects: Get project error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/plugins/projects/[projectId]
 * Delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const platform = detectPlatform(request);
    const { projectId } = params;
    
    // Apply rate limiting
    const rateLimit = await applyPluginRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimit.response!;
    }
    
    if (!isValidUUID(projectId)) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INVALID_INPUT, { field: 'projectId' }),
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
    // Project deletion might need a specific scope, but for now allow if authenticated
    // In the future, we could add 'projects:write' or 'projects:delete' scope

    const project = await ProjectsDAL.getById(projectId);

    if (!project) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.NOT_FOUND, { resource: 'project' }),
        { status: 404 }
      );
    }

    // Verify project belongs to user
    if (project.userId !== authResult.auth.user.id) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { reason: 'Project does not belong to user' }),
        { status: 403 }
      );
    }

    // Delete project (cascade will handle related renders)
    await ProjectsDAL.delete(projectId);

    logger.log('✅ Plugin Projects: Project deleted', {
      userId: authResult.auth.user.id,
      projectId,
      platform: platform.platform,
    });

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    logger.error('❌ Plugin Projects: Delete project error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

