'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { RenderService } from '@/lib/services/render';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import { RenderChainService } from '@/lib/services/render-chain';
import { PlanLimitsService } from '@/lib/services/plan-limits.service';
import { getUserFromAction } from '@/lib/utils/get-user-from-action';
import { getCachedUser } from '@/lib/services/auth-cache';
import { uploadSchema, createRenderSchema } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { TaskAutomationService } from '@/lib/services/task-automation.service';

const renderService = new RenderService();

export async function createProject(formData: FormData) {
  try {
    logger.log('🚀 [createProject] Starting project creation action');
    
    // Try to get userId from formData first (passed from client store)
    const userIdFromClient = formData.get('userId') as string | null;
    const { user, userId } = await getUserFromAction(userIdFromClient);
    
    if (!user || !userId) {
      logger.error('❌ [createProject] Authentication required');
      return { success: false, error: 'Authentication required' };
    }

    logger.log('✅ [createProject] User authenticated:', { userId, email: user.email });

    // ✅ CHECK LIMIT: Verify user can create a new project
    const projectLimitCheck = await PlanLimitsService.checkProjectLimit(userId);
    if (!projectLimitCheck.allowed) {
      logger.warn('❌ [createProject] Project limit reached:', projectLimitCheck);
      return {
        success: false,
        error: projectLimitCheck.error || 'Project limit reached',
        limitReached: true,
        limitType: projectLimitCheck.limitType,
        current: projectLimitCheck.current,
        limit: projectLimitCheck.limit,
        planName: projectLimitCheck.planName || 'Free', // ✅ FIXED: Include planName
      };
    }

    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;
    const description = formData.get('description') as string;
    const dicebearUrl = formData.get('dicebearUrl') as string;
    const isToolsProject = formData.get('isToolsProject') === 'true';
    const platform = (formData.get('platform') as 'render' | 'tools' | 'canvas') || 'render';
    const tagsJson = formData.get('tags') as string | null;
    const isPublic = formData.get('isPublic') === 'true';
    
    // Parse tags if provided
    let tags: string[] | undefined;
    if (tagsJson) {
      try {
        tags = JSON.parse(tagsJson);
      } catch (e) {
        // If parsing fails, treat as comma-separated string
        tags = tagsJson.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    logger.log('📝 [createProject] Form data received:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      projectName, 
      description,
      hasDicebearUrl: !!dicebearUrl
    });

    if (!projectName) {
      logger.error('❌ [createProject] No project name provided');
      return { success: false, error: 'Project name is required' };
    }

    // If DiceBear URL is provided, create project directly without file upload
    if (dicebearUrl) {
      logger.log('🎨 [createProject] Creating project with DiceBear URL:', dicebearUrl);
      
      const projectData = {
        userId: userId,
        name: projectName,
        description: description || undefined,
        originalImageId: null, // No file upload needed
        isPublic: isPublic || false,
        tags: tags || (dicebearUrl ? ['shape-based', 'ai-generated'] : undefined),
        platform: platform,
        metadata: {
          ...(dicebearUrl ? { dicebearUrl, createdBy: 'shape-generator' } : {})
        }
      };

      const project = await ProjectsDAL.create(projectData);
      logger.log('✅ [createProject] Project created successfully:', project.id);

      // ✅ Trigger task automation for project creation (non-blocking)
      TaskAutomationService.onProjectCreated(userId, project.id)
        .catch((error) => logger.warn('⚠️ Task automation failed for project creation:', error));

      revalidatePath('/dashboard/projects');
      revalidatePath('/render');
      
      return { success: true, data: project };
    }

    // If this is a Tools project, create it without a file
    if (isToolsProject) {
      logger.log('🛠️ [createProject] Creating Tools project without file');
      
      const projectData = {
        userId: userId,
        name: projectName,
        description: description || 'Default project for micro-tools and specialized AI tools',
        originalImageId: null, // No file upload needed
        isPublic: isPublic || false,
        tags: tags || ['tools', 'micro-tools'],
        platform: platform === 'render' ? 'tools' : platform, // Override for tools projects
        metadata: {
          createdBy: 'tools-project',
          isToolsProject: true
        }
      };

      const project = await ProjectsDAL.create(projectData);
      logger.log('✅ [createProject] Tools project created successfully:', project.id);

      // ✅ Trigger task automation for project creation (non-blocking)
      TaskAutomationService.onProjectCreated(userId, project.id)
        .catch((error) => logger.warn('⚠️ Task automation failed for project creation:', error));

      revalidatePath('/dashboard/projects');
      revalidatePath('/render');
      
      return { success: true, data: project };
    }

    // File upload logic for regular projects (file is optional now)
    if (file) {
      logger.log('✅ [createProject] Validating form data with file...');
      const validatedData = uploadSchema.parse({
        file,
        projectName,
        description: description || undefined,
      });
      logger.log('✅ [createProject] Form data validated successfully');

      logger.log('🎨 [createProject] Calling render service with file...');
      const result = await renderService.createProject(
        userId,
        validatedData.file,
        validatedData.projectName,
        validatedData.description,
        tags,
        isPublic,
        platform
      );

      if (result.success && result.data) {
        logger.log('✅ [createProject] Project created successfully, revalidating paths...');
        
        // Note: GA4 tracking happens client-side after action completes
        
        // ✅ Trigger task automation for project creation (non-blocking)
        TaskAutomationService.onProjectCreated(userId, result.data.id)
          .catch((error) => logger.warn('⚠️ Task automation failed for project creation:', error));
        
        revalidatePath('/dashboard/projects');
        revalidatePath('/render');
        revalidatePath('/canvas');
        logger.log('🎉 [createProject] Project creation completed successfully');
        return { success: true, data: result.data };
      }

      logger.error('❌ [createProject] Project creation failed:', result.error);
      return { success: false, error: result.error || 'Failed to create project' };
    }

    // No file provided and no dicebearUrl - generate fallback
    if (!dicebearUrl) {
      logger.log('🎨 [createProject] No file or dicebear URL, generating fallback avatar');
      const shapes = ['square', 'circle', 'triangle', 'hexagon', 'pentagon', 'octagon'];
      const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
      const fallbackDicebearUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(projectName + randomShape)}&backgroundColor=transparent&shape1Color=4a90e2&shape2Color=7b68ee&shape3Color=ff6b6b`;
      
      const projectData = {
        userId: userId,
        name: projectName,
        description: description || undefined,
        originalImageId: null,
        isPublic: isPublic || false,
        tags: tags,
        platform: platform,
        metadata: {
          dicebearUrl: fallbackDicebearUrl,
          createdBy: 'auto-generator'
        }
      };

      const project = await ProjectsDAL.create(projectData);
      logger.log('✅ [createProject] Project created with fallback avatar:', project.id);

      revalidatePath('/dashboard/projects');
      revalidatePath('/render');
      revalidatePath('/canvas');
      
      return { success: true, data: project };
    }

    if (result.success) {
      logger.log('✅ [createProject] Project created successfully, revalidating paths...');
      revalidatePath('/dashboard/projects');
      logger.log('🎉 [createProject] Project creation completed successfully');
      return { success: true, data: result.data };
    }

    logger.error('❌ [createProject] Project creation failed:', result.error);
    return result;
  } catch (error) {
    logger.error('❌ [createProject] Unexpected error:', error);
    if (error instanceof z.ZodError) {
      logger.error('❌ [createProject] Validation error:', error.issues);
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}


export async function createRender(formData: FormData) {
  try {
    // Try to get userId from formData first (passed from client store)
    const userIdFromClient = formData.get('userId') as string | null;
    const { user, userId } = await getUserFromAction(userIdFromClient);
    
    if (!user || !userId) {
      return { success: false, error: 'Authentication required' };
    }

    const projectId = formData.get('projectId') as string;
    const type = formData.get('type') as 'image' | 'video';
    const prompt = formData.get('prompt') as string;
    const style = formData.get('style') as string;
    const quality = formData.get('quality') as 'standard' | 'high' | 'ultra';
    const aspectRatio = formData.get('aspectRatio') as string;
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined;
    const uploadedImageData = formData.get('uploadedImageData') as string | null;
    const uploadedImageType = formData.get('uploadedImageType') as string | null;

    const validatedData = createRenderSchema.parse({
      projectId,
      type,
      prompt,
      settings: {
        style,
        quality,
        aspectRatio,
        duration,
      },
      uploadedImageData: uploadedImageData || undefined,
      uploadedImageType: uploadedImageType || undefined,
    });

    const result = await renderService.createRender(validatedData);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create render',
    };
  }
}

export async function getProject(projectId: string) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    const project = await ProjectsDAL.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    return { success: true, data: project };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project',
    };
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    const project = await ProjectsDAL.getBySlug(slug);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    return { success: true, data: project };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project',
    };
  }
}

export async function getUserProjects(platform?: 'render' | 'tools' | 'canvas') {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    // Get projects with render counts in a single query, filtered by platform if provided
    const projects = platform 
      ? await ProjectsDAL.getByUserId(userId, 100, 0, platform)
      : await ProjectsDAL.getByUserIdWithRenderCounts(userId);
    
    if (projects.length === 0) {
      return { success: true, data: [] };
    }

    // If platform filter is used, return projects directly (no render counts needed)
    if (platform) {
      return { success: true, data: projects };
    }

    // Batch fetch: Get all latest renders for all projects in ONE query
    const projectIds = projects.map(p => p.id);
    const allLatestRenders = await ProjectsDAL.getLatestRendersForProjects(projectIds, 4);
    
    // Group renders by project
    const rendersByProject = allLatestRenders.reduce((acc, render) => {
      if (!acc[render.projectId]) {
        acc[render.projectId] = [];
      }
      acc[render.projectId].push(render);
      return acc;
    }, {} as Record<string, typeof allLatestRenders>);
    
    // Attach renders to projects
    const projectsWithRenders = projects.map(project => ({
      ...project,
      latestRenders: rendersByProject[project.id] || []
    }));
    
    return { success: true, data: projectsWithRenders };
  } catch (error) {
    logger.error('Error in getUserProjects:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get projects',
    };
  }
}

export async function updateProject(projectId: string, updateData: {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
  tags?: string[] | null;
}) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify project belongs to user
    const project = await ProjectsDAL.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update project
    const updatedProject = await ProjectsDAL.update(projectId, updateData);
    
    logger.log('✅ [updateProject] Project updated successfully:', projectId);
    
    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${updatedProject.slug}`);
    revalidatePath(`/project/${updatedProject.slug}`);
    
    return { success: true, data: updatedProject };
  } catch (error) {
    logger.error('Error in updateProject:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    };
  }
}

export async function duplicateProject(projectId: string, newName?: string) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const userId = user.id;

    const project = await ProjectsDAL.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    // Create duplicate project with custom name or default
    const duplicateData = {
      userId: userId,
      name: newName || `${project.name} (Copy)`,
      description: project.description,
      originalImageId: project.originalImageId,
      isPublic: false, // Duplicates are private by default
      tags: project.tags,
      metadata: project.metadata,
    };

    const newProject = await ProjectsDAL.create(duplicateData);
    revalidatePath('/dashboard/projects');
    return { success: true, data: newProject };
  } catch (error) {
    logger.error('Error in duplicateProject:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate project',
    };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    const project = await ProjectsDAL.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    await ProjectsDAL.delete(projectId);
    revalidatePath('/dashboard/projects');
    revalidatePath('/render');
    revalidatePath('/engine');
    return { success: true };
  } catch (error) {
    logger.error('Error in deleteProject:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    };
  }
}

export async function getRendersByProject(projectId: string) {
  try {
    logger.log('🎨 [getRendersByProject] Starting to fetch renders for project:', projectId);
    
    const { user } = await getCachedUser();
    
    if (!user) {
      logger.error('❌ [getRendersByProject] No user found');
      return { success: false, error: 'Authentication required' };
    }

    const userId = user.id;
    logger.log('✅ [getRendersByProject] User authenticated:', { userId });

    logger.log('📞 [getRendersByProject] Calling RendersDAL.getByProjectId...');
    const renders = await RendersDAL.getByProjectId(projectId);
    logger.log('📊 [getRendersByProject] Renders fetched:', renders.length);

    return { success: true, data: renders };
  } catch (error) {
    logger.error('❌ [getRendersByProject] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get renders',
    };
  }
}

// ============================================================================
// RENDER CHAIN MANAGEMENT ACTIONS
// ============================================================================

export async function createRenderChain(
  projectId: string,
  name: string,
  description?: string
) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    // Verify project ownership
    const project = await ProjectsDAL.getById(projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    const chain = await RenderChainService.createChain(projectId, name, description);
    // ✅ FIX: Revalidate both /engine and /render paths
    revalidatePath(`/engine`);
    revalidatePath(`/render`);
    return { success: true, data: chain };
  } catch (error) {
    logger.error('Error in createRenderChain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create render chain',
    };
  }
}

export async function getProjectChains(projectId: string) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    // Verify project ownership
    const project = await ProjectsDAL.getById(projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    const chains = await RenderChainService.getProjectChains(projectId);
    return { success: true, data: chains };
  } catch (error) {
    logger.error('Error in getProjectChains:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get render chains',
    };
  }
}

/**
 * ✅ OPTIMIZED: Batch get chains for multiple projects in ONE query
 * This replaces sequential calls to getProjectChains for each project
 */
export async function getChainsForProjects(projectIds: string[]) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    // Verify all projects belong to user (batch check)
    const projects = await ProjectsDAL.getByIds(projectIds);
    const userProjectIds = projects
      .filter(p => p.userId === userId)
      .map(p => p.id);

    if (userProjectIds.length === 0) {
      return { success: true, data: {} };
    }

    const chainsByProject = await RenderChainService.getChainsForProjects(userProjectIds);
    return { success: true, data: chainsByProject };
  } catch (error) {
    logger.error('Error in getChainsForProjects:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get render chains',
    };
  }
}

/**
 * ✅ NEW: Get all user chains with renders (equivalent to /api/projects/chains)
 * This replaces the API route usage in dashboard layout
 */
export async function getUserChainsWithRenders() {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const chains = await RenderChainsDAL.getUserChainsWithRenders(user.id);
    return { success: true, data: chains };
  } catch (error) {
    logger.error('Error in getUserChainsWithRenders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get render chains',
    };
  }
}

export async function addRenderToChain(
  chainId: string,
  renderId: string,
  position?: number
) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    // Verify render ownership
    const render = await RendersDAL.getById(renderId);
    if (!render || render.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    await RenderChainService.addRenderToChain(chainId, renderId, position);
    revalidatePath(`/engine`);
    return { success: true };
  } catch (error) {
    logger.error('Error in addRenderToChain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add render to chain',
    };
  }
}

export async function selectRenderVersion(renderId: string) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    // ✅ OPTIMIZED: Use getWithContext directly (it already fetches the render)
    // Then verify ownership from the result to avoid duplicate query
    const renderWithContext = await RendersDAL.getWithContext(renderId);
    
    if (!renderWithContext || renderWithContext.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    return { success: true, data: renderWithContext };
  } catch (error) {
    logger.error('Error in selectRenderVersion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to select render version',
    };
  }
}

export async function getRenderChain(chainId: string) {
  try {
    logger.log('🔍 getRenderChain: Fetching chain:', chainId);
    
    const { user } = await getCachedUser();
    
    if (!user) {
      logger.log('❌ getRenderChain: Authentication required');
      return { success: false, error: 'Authentication required' };
    }

    const userId = user.id;
    logger.log('✅ getRenderChain: User authenticated:', userId);

    // ✅ OPTIMIZED: Fetch chain with renders (uses optimized JOIN query)
    const chainWithRenders = await RenderChainService.getChain(chainId);
    
    if (!chainWithRenders) {
      logger.log('❌ getRenderChain: Chain not found:', chainId);
      return { success: false, error: 'Chain not found' };
    }

    // ✅ OPTIMIZED: Verify project ownership (sequential but necessary - need chain.projectId first)
    // Note: Can't parallelize because we need chain.projectId to fetch project
    const project = await ProjectsDAL.getById(chainWithRenders.projectId);
    
    if (!project || project.userId !== userId) {
      logger.log('❌ getRenderChain: Access denied');
      return { success: false, error: 'Access denied' };
    }

    logger.log('✅ getRenderChain: Access granted, returning chain data', {
      chainId: chainWithRenders.id,
      chainName: chainWithRenders.name,
      projectId: chainWithRenders.projectId,
      rendersCount: chainWithRenders.renders?.length || 0,
    });

    return { success: true, data: chainWithRenders };
  } catch (error) {
    logger.error('❌ getRenderChain: Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get render chain',
    };
  }
}

export async function updateRenderChain(
  chainId: string,
  updateData: {
    name?: string;
    description?: string | null;
  }
) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    const chain = await RenderChainService.getChain(chainId);
    
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    // Verify project ownership
    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    const updatedChain = await RenderChainsDAL.update(chainId, updateData);
    revalidatePath('/engine');
    revalidatePath('/render');
    revalidatePath(`/project/${project.slug}/chain/${chainId}`);
    return { success: true, data: updatedChain };
  } catch (error) {
    logger.error('Error in updateRenderChain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update render chain',
    };
  }
}

export async function duplicateRenderChain(chainId: string, newName?: string) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    const chain = await RenderChainService.getChain(chainId);
    
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    // Verify project ownership
    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    // Create duplicate chain
    const newChain = await RenderChainService.createChain(
      chain.projectId,
      newName || `${chain.name} (Copy)`,
      chain.description || undefined
    );
    
    revalidatePath('/engine');
    revalidatePath('/render');
    return { success: true, data: newChain };
  } catch (error) {
    logger.error('Error in duplicateRenderChain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate render chain',
    };
  }
}

export async function deleteRenderChain(chainId: string) {
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const userId = user.id;

    const chain = await RenderChainService.getChain(chainId);
    
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    // Verify project ownership
    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    await RenderChainService.deleteChain(chainId);
    revalidatePath('/engine');
    revalidatePath('/render');
    return { success: true };
  } catch (error) {
    logger.error('Error in deleteRenderChain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete render chain',
    };
  }
}
