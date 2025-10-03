'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { RenderService } from '@/lib/services/render';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/projects';
import { createClient } from '@/lib/supabase/server';
import { uploadSchema, createRenderSchema } from '@/lib/types';

const renderService = new RenderService();

export async function createProject(formData: FormData) {
  try {
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    const file = formData.get('file') as File;
    const projectName = formData.get('projectName') as string;
    const description = formData.get('description') as string;

    const validatedData = uploadSchema.parse({
      file,
      projectName,
      description: description || undefined,
    });

    const result = await renderService.createProject(
      user.data.user.id,
      validatedData.file,
      validatedData.projectName,
      validatedData.description
    );

    if (result.success) {
      revalidatePath('/projects');
      return { success: true, data: result.data };
    }

    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
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
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
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
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    const project = await ProjectsDAL.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== user.data.user.id) {
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
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    const projects = await ProjectsDAL.getByUserId(user.data.user.id);
    return { success: true, data: projects };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get projects',
    };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const { user } = await createClient().auth.getUser();
    if (!user.data.user) {
      return { success: false, error: 'Authentication required' };
    }

    const project = await ProjectsDAL.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    if (project.userId !== user.data.user.id) {
      return { success: false, error: 'Access denied' };
    }

    await ProjectsDAL.delete(projectId);
    revalidatePath('/projects');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    };
  }
}
