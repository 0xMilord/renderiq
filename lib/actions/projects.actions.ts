'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { RenderService } from '@/lib/services/render';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainService } from '@/lib/services/render-chain';
import { createClient } from '@/lib/supabase/server';
import { uploadSchema, createRenderSchema } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

const renderService = new RenderService();

export async function createProject(formData: FormData) {
  try {
    logger.log('🚀 [createProject] Starting project creation action');
    
    const supabase = await createClient();
    if (!supabase) {
      logger.error('❌ [createProject] Failed to initialize database connection');
      return { success: false, error: 'Failed to initialize database connection' };
    }

    logger.log('🔐 [createProject] Getting user authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('❌ [createProject] Auth error:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
      logger.error('❌ [createProject] No user found');
      return { success: false, error: 'Authentication required' };
    }

    logger.log('✅ [createProject] User authenticated:', { userId: user.id, email: user.email });

    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;
    const description = formData.get('description') as string;
    const dicebearUrl = formData.get('dicebearUrl') as string;

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
        userId: user.id,
        name: projectName,
        description: description || 'AI-generated project',
        originalImageId: null, // No file upload needed
        isPublic: false,
        tags: ['shape-based', 'ai-generated'],
        metadata: {
          dicebearUrl,
          createdBy: 'shape-generator'
        }
      };

      const project = await ProjectsDAL.create(projectData);
      logger.log('✅ [createProject] Project created successfully:', project.id);

      revalidatePath('/dashboard/projects');
      revalidatePath('/render');
      
      return { success: true, data: project };
    }

    // Original file upload logic for regular projects
    if (!file) {
      logger.error('❌ [createProject] No file provided');
      return { success: false, error: 'File is required' };
    }

    logger.log('✅ [createProject] Validating form data...');
    const validatedData = uploadSchema.parse({
      file,
      projectName,
      description: description || undefined,
    });
    logger.log('✅ [createProject] Form data validated successfully');

    logger.log('🎨 [createProject] Calling render service...');
    const result = await renderService.createProject(
      user.id,
      validatedData.file,
      validatedData.projectName,
      validatedData.description
    );

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
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('Auth error in createRender:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
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
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('Auth error in getProject:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const project = await ProjectsDAL.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== user.id) {
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
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('Auth error in getProjectBySlug:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const project = await ProjectsDAL.getBySlug(slug);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== user.id) {
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

export async function getUserProjects() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('Auth error in getUserProjects:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Get projects with render counts in a single query
    const projects = await ProjectsDAL.getByUserIdWithRenderCounts(user.id);
    
    if (projects.length === 0) {
      return { success: true, data: [] };
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

export async function duplicateProject(projectId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('Auth error in duplicateProject:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const project = await ProjectsDAL.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== user.id) {
      return { success: false, error: 'Access denied' };
    }

    // Create duplicate project
    const duplicateData = {
      userId: user.id,
      name: `${project.name} (Copy)`,
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
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('Auth error in deleteProject:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const project = await ProjectsDAL.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== user.id) {
      return { success: false, error: 'Access denied' };
    }

    await ProjectsDAL.delete(projectId);
    revalidatePath('/dashboard/projects');
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
    
    const supabase = await createClient();
    if (!supabase) {
      logger.error('❌ [getRendersByProject] Failed to initialize database connection');
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('❌ [getRendersByProject] Auth error:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
      logger.error('❌ [getRendersByProject] No user found');
      return { success: false, error: 'Authentication required' };
    }

    logger.log('✅ [getRendersByProject] User authenticated:', { userId: user.id });

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
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify project ownership
    const project = await ProjectsDAL.getById(projectId);
    if (!project || project.userId !== user.id) {
      return { success: false, error: 'Access denied' };
    }

    const chain = await RenderChainService.createChain(projectId, name, description);
    revalidatePath(`/engine`);
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
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify project ownership
    const project = await ProjectsDAL.getById(projectId);
    if (!project || project.userId !== user.id) {
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

export async function addRenderToChain(
  chainId: string,
  renderId: string,
  position?: number
) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify render ownership
    const render = await RendersDAL.getById(renderId);
    if (!render || render.userId !== user.id) {
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
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify render ownership
    const render = await RendersDAL.getById(renderId);
    if (!render || render.userId !== user.id) {
      return { success: false, error: 'Access denied' };
    }

    // Return the render with context
    const renderWithContext = await RendersDAL.getWithContext(renderId);
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
    
    const supabase = await createClient();
    if (!supabase) {
      logger.log('❌ getRenderChain: Failed to initialize database connection');
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.log('❌ getRenderChain: Authentication required');
      return { success: false, error: 'Authentication required' };
    }

    logger.log('✅ getRenderChain: User authenticated:', user.id);

    const chain = await RenderChainService.getChain(chainId);
    
    if (!chain) {
      logger.log('❌ getRenderChain: Chain not found:', chainId);
      return { success: false, error: 'Chain not found' };
    }

    logger.log('✅ getRenderChain: Chain found', {
      chainId: chain.id,
      chainName: chain.name,
      projectId: chain.projectId,
      rendersCount: chain.renders?.length || 0,
      renderDetails: chain.renders?.map(r => ({
        id: r.id,
        prompt: r.prompt?.substring(0, 50) + '...',
        status: r.status,
        chainPosition: r.chainPosition,
        type: r.type,
        hasOutputUrl: !!r.outputUrl,
        createdAt: r.createdAt
      })) || []
    });

    // Verify project ownership
    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== user.id) {
      logger.log('❌ getRenderChain: Access denied');
      return { success: false, error: 'Access denied' };
    }

    logger.log('✅ getRenderChain: Access granted, returning chain data');
    return { success: true, data: chain };
  } catch (error) {
    logger.error('❌ getRenderChain: Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get render chain',
    };
  }
}

export async function deleteRenderChain(chainId: string) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const chain = await RenderChainService.getChain(chainId);
    
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    // Verify project ownership
    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== user.id) {
      return { success: false, error: 'Access denied' };
    }

    await RenderChainService.deleteChain(chainId);
    revalidatePath('/engine');
    return { success: true };
  } catch (error) {
    logger.error('Error in deleteRenderChain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete render chain',
    };
  }
}
