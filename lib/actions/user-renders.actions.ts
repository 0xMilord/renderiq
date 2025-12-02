'use server';

import { revalidatePath } from 'next/cache';
import { RendersDAL } from '@/lib/dal/renders';
import { createClient } from '@/lib/supabase/server';
import type { Render } from '@/lib/types/render';
import { logger } from '@/lib/utils/logger';

export async function getUserRenders(projectId?: string, limit = 50) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const renders = await RendersDAL.getByUser(user.id, projectId, limit);
    
    return {
      success: true,
      data: renders,
    };
  } catch (error) {
    logger.error('Failed to get user renders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user renders',
    };
  }
}

export async function getUserRenderById(renderId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const render = await RendersDAL.getById(renderId);
    
    if (!render) {
      return {
        success: false,
        error: 'Render not found',
      };
    }

    // Check if user owns this render
    if (render.userId !== user.id) {
      return {
        success: false,
        error: 'Access denied',
      };
    }
    
    return {
      success: true,
      data: render,
    };
  } catch (error) {
    logger.error('Failed to get user render:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user render',
    };
  }
}
