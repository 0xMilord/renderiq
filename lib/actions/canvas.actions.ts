'use server';

import { getCachedUser } from '@/lib/services/auth-cache';
import { canvasService } from '@/lib/services/canvas.service';
import { RendersDAL } from '@/lib/dal/renders';
import { logger } from '@/lib/utils/logger';
import type { CanvasState, CanvasMetadata } from '@/lib/types/render';

/**
 * Server Actions for Canvas
 * Follows same pattern as render.actions.ts and other action files
 */

/**
 * Save canvas state to render
 * Verifies ownership before saving
 */
export async function saveCanvasStateAction(
  renderId: string,
  canvasState: CanvasState
) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify render ownership
    const render = await RendersDAL.getById(renderId);
    if (!render || render.userId !== user.id) {
      return { success: false, error: 'Render not found or unauthorized' };
    }

    await canvasService.saveCanvasState(renderId, canvasState);

    return { success: true };
  } catch (error) {
    logger.error('❌ saveCanvasStateAction: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Load canvas state from render
 */
export async function loadCanvasStateAction(renderId: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const render = await RendersDAL.getById(renderId);
    if (!render || render.userId !== user.id) {
      return { success: false, error: 'Render not found or unauthorized' };
    }

    const canvasState = await canvasService.loadCanvasState(renderId);

    return { success: true, data: canvasState };
  } catch (error) {
    logger.error('❌ loadCanvasStateAction: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Load canvas state from chain (latest render)
 * Useful for restoring canvas when opening a chain
 */
export async function loadChainCanvasStateAction(chainId: string) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify chain ownership (via project)
    const { RenderChainsDAL } = await import('@/lib/dal/render-chains');
    const { ProjectsDAL } = await import('@/lib/dal/projects');
    
    const chain = await RenderChainsDAL.getById(chainId);
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const canvasState = await canvasService.getChainCanvasState(chainId);

    return { 
      success: true, 
      data: canvasState ? { canvasData: canvasState } : null 
    };
  } catch (error) {
    logger.error('❌ loadChainCanvasStateAction: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save canvas state to chain (saves to latest render)
 * Ensures chain-level state is always up to date
 */
export async function saveChainCanvasStateAction(
  chainId: string,
  canvasState: CanvasState
) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify chain ownership (via project)
    const { RenderChainsDAL } = await import('@/lib/dal/render-chains');
    const { ProjectsDAL } = await import('@/lib/dal/projects');
    
    const chain = await RenderChainsDAL.getById(chainId);
    if (!chain) {
      return { success: false, error: 'Chain not found' };
    }

    const project = await ProjectsDAL.getById(chain.projectId);
    if (!project || project.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await canvasService.saveChainCanvasState(chainId, canvasState);

    return { success: true };
  } catch (error) {
    logger.error('❌ saveChainCanvasStateAction: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update canvas metadata (viewport, zoom, etc.)
 */
export async function updateCanvasMetadataAction(
  renderId: string,
  metadata: Partial<CanvasMetadata>
) {
  try {
    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const render = await RendersDAL.getById(renderId);
    if (!render || render.userId !== user.id) {
      return { success: false, error: 'Render not found or unauthorized' };
    }

    await canvasService.updateCanvasMetadata(renderId, metadata);

    return { success: true };
  } catch (error) {
    logger.error('❌ updateCanvasMetadataAction: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

