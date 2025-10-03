'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { RenderService } from '@/lib/services/render';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/projects';
import { createClient } from '@/lib/supabase/server';
import { uploadSchema, createRenderSchema } from '@/lib/types';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const renderService = new RenderService();

export async function createProject(formData: FormData) {
  try {
    console.log('🚀 [createProject] Starting project creation action');
    
    const supabase = await createClient();
    if (!supabase) {
      console.error('❌ [createProject] Failed to initialize database connection');
      return { success: false, error: 'Failed to initialize database connection' };
    }

    console.log('🔐 [createProject] Getting user authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ [createProject] Auth error:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
      console.error('❌ [createProject] No user found');
      return { success: false, error: 'Authentication required' };
    }

    console.log('✅ [createProject] User authenticated:', { userId: user.id, email: user.email });

    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;
    const description = formData.get('description') as string;

    console.log('📝 [createProject] Form data received:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      projectName, 
      description 
    });

    if (!file) {
      console.error('❌ [createProject] No file provided');
      return { success: false, error: 'File is required' };
    }

    if (!projectName) {
      console.error('❌ [createProject] No project name provided');
      return { success: false, error: 'Project name is required' };
    }

    console.log('✅ [createProject] Validating form data...');
    const validatedData = uploadSchema.parse({
      file,
      projectName,
      description: description || undefined,
    });
    console.log('✅ [createProject] Form data validated successfully');

    console.log('🎨 [createProject] Calling render service...');
    const result = await renderService.createProject(
      user.id,
      validatedData.file,
      validatedData.projectName,
      validatedData.description
    );

    if (result.success) {
      console.log('✅ [createProject] Project created successfully, revalidating paths...');
      revalidatePath('/dashboard/projects');
      revalidatePath('/projects');
      console.log('🎉 [createProject] Project creation completed successfully');
      return { success: true, data: result.data };
    }

    console.error('❌ [createProject] Project creation failed:', result.error);
    return result;
  } catch (error) {
    console.error('❌ [createProject] Unexpected error:', error);
    if (error instanceof z.ZodError) {
      console.error('❌ [createProject] Validation error:', error.errors);
      return { success: false, error: error.errors[0].message };
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
      console.error('Auth error in createRender:', authError);
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
    });

    const result = await renderService.createRender(validatedData);

    if (result.success) {
      revalidatePath(`/projects/${projectId}`);
      return { success: true, data: result.data };
    }

    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
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
      console.error('Auth error in getProject:', authError);
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

export async function getUserProjects() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in getUserProjects:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const projects = await ProjectsDAL.getByUserId(user.id);
    return { success: true, data: projects };
  } catch (error) {
    console.error('Error in getUserProjects:', error);
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
      console.error('Auth error in duplicateProject:', authError);
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
    console.error('Error in duplicateProject:', error);
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
      console.error('Auth error in deleteProject:', authError);
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
    console.error('Error in deleteProject:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    };
  }
}

export async function getRendersByProject(projectId: string) {
  try {
    console.log('🎨 [getRendersByProject] Starting to fetch renders for project:', projectId);
    
    const supabase = await createClient();
    if (!supabase) {
      console.error('❌ [getRendersByProject] Failed to initialize database connection');
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ [getRendersByProject] Auth error:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    if (!user) {
      console.error('❌ [getRendersByProject] No user found');
      return { success: false, error: 'Authentication required' };
    }

    console.log('✅ [getRendersByProject] User authenticated:', { userId: user.id });

    console.log('📞 [getRendersByProject] Calling RendersDAL.getByProjectId...');
    const renders = await RendersDAL.getByProjectId(projectId);
    console.log('📊 [getRendersByProject] Renders fetched:', renders.length);

    return { success: true, data: renders };
  } catch (error) {
    console.error('❌ [getRendersByProject] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get renders',
    };
  }
}
