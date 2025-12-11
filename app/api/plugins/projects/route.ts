import { NextRequest, NextResponse } from 'next/server';
import { authenticatePluginRequest, hasRequiredScope } from '@/lib/utils/plugin-auth';
import { ProjectsDAL } from '@/lib/dal/projects';
import { detectPlatform, normalizePlatformForDB } from '@/lib/utils/platform-detection';
import { logger } from '@/lib/utils/logger';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';
import { createErrorResponse, PluginErrorCode } from '@/lib/utils/plugin-error-codes';

/**
 * GET /api/plugins/projects
 * List user's projects
 */
export async function GET(request: NextRequest) {
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
    if (!hasRequiredScope(authResult.auth, 'projects:read')) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.INSUFFICIENT_PERMISSIONS, { requiredScope: 'projects:read' }),
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get all projects (platform filtering happens in DAL)
    const allProjects = await ProjectsDAL.getByUserId(authResult.auth.user.id);

    // Filter by platform if specified
    const platformFilter = searchParams.get('platform');
    const filteredProjects = platformFilter
      ? allProjects.filter(p => (p.metadata as any)?.sourcePlatform === platformFilter)
      : allProjects;

    // Apply pagination
    const paginatedProjects = filteredProjects.slice(offset, offset + limit);

    // Get render counts for each project
    const { RendersDAL } = await import('@/lib/dal/renders');
    const projectsWithCounts = await Promise.all(
      paginatedProjects.map(async (project) => {
        const renders = await RendersDAL.getByProjectId(project.id);
        return {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          createdAt: project.createdAt.toISOString(),
          renderCount: renders.length,
          platform: (project.metadata as any)?.sourcePlatform || platform.platform,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        projects: projectsWithCounts,
        total: filteredProjects.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.error('❌ Plugin Projects: List error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST /api/plugins/projects
 * Create a new project
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

    // Check scope if using API key (creating projects might not need special scope, but let's check)
    // Actually, project creation doesn't have a specific scope - it's part of the render flow
    // So we'll allow it for any authenticated user

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || null;
    const image = formData.get('image') as File | null;

    if (!name) {
      return NextResponse.json(
        createErrorResponse(PluginErrorCode.MISSING_REQUIRED_FIELD, { field: 'name' }),
        { status: 400 }
      );
    }

    const { RenderService } = await import('@/lib/services/render');
    const renderService = new RenderService();

    let project;
    if (image) {
      // Create project with image
      const result = await renderService.createProject(
        authResult.auth.user.id,
        image,
        name,
        description || undefined,
        undefined, // tags
        false, // isPublic
        normalizePlatformForDB(platform.platform)
      );

      if (!result.success || !result.data) {
        return NextResponse.json(
          createErrorResponse(PluginErrorCode.INTERNAL_ERROR, { reason: result.error }),
          { status: 500 }
        );
      }

      project = result.data;
    } else {
      // Create project without image
      project = await ProjectsDAL.create({
        userId: authResult.auth.user.id,
        name,
        description: description || undefined,
        status: 'processing',
        isPublic: false,
        platform: normalizePlatformForDB(platform.platform),
        metadata: {
          sourcePlatform: platform.platform,
          ...(platform.version && { pluginVersion: platform.version }),
        },
      });
    }

    logger.log('✅ Plugin Projects: Project created', {
      userId: authResult.auth.user.id,
      projectId: project.id,
      platform: platform.platform,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          createdAt: project.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('❌ Plugin Projects: Create error:', error);
    return NextResponse.json(
      createErrorResponse(PluginErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

