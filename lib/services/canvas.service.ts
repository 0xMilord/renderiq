import { logger } from '@/lib/utils/logger';
import { RendersDAL } from '@/lib/dal/renders';
import type { CanvasState, CanvasLayer, CanvasMask } from '@/lib/types/render';

/**
 * Canvas Service
 * Manages canvas state persistence and operations
 * Follows same pattern as RenderChainService and other services
 */
export class CanvasService {
  private static instance: CanvasService;

  static getInstance(): CanvasService {
    if (!CanvasService.instance) {
      CanvasService.instance = new CanvasService();
    }
    return CanvasService.instance;
  }

  /**
   * Save canvas state to render's contextData
   * Merges with existing contextData to preserve pipeline context
   */
  async saveCanvasState(
    renderId: string,
    canvasState: CanvasState
  ): Promise<void> {
    try {
      const render = await RendersDAL.getById(renderId);
      if (!render) {
        throw new Error(`Render ${renderId} not found`);
      }

      // Merge with existing contextData (preserve pipeline context)
      const existingContextData = (render as any).contextData || {};
      
      // Use updateContext method to update contextData
      await RendersDAL.updateContext(renderId, {
        ...existingContextData,
        tldrawCanvasState: {
          ...canvasState,
          version: canvasState.version || '1.0.0',
        },
      });

      logger.log('✅ CanvasService: Saved canvas state', { renderId });
    } catch (error) {
      logger.error('❌ CanvasService: Failed to save canvas state', error);
      throw error;
    }
  }

  /**
   * Load canvas state from render's contextData
   */
  async loadCanvasState(renderId: string): Promise<CanvasState | null> {
    try {
      const render = await RendersDAL.getById(renderId);
      if (!render) return null;

      const contextData = (render as any).contextData;
      return contextData?.tldrawCanvasState || null;
    } catch (error) {
      logger.error('❌ CanvasService: Failed to load canvas state', error);
      return null;
    }
  }

  /**
   * Get canvas state from latest render in chain
   * Useful for restoring canvas when opening a chain
   */
  async getChainCanvasState(chainId: string): Promise<CanvasState | null> {
    try {
      // Get all renders for this chain
      const renders = await RendersDAL.getByChainId(chainId);
      
      if (!renders || renders.length === 0) {
        return null;
      }

      // Get latest render (highest chainPosition, or most recent if no position)
      const latestRender = renders
        .sort((a, b) => {
          const posA = (a as any).chainPosition ?? -1;
          const posB = (b as any).chainPosition ?? -1;
          if (posA !== posB) return posB - posA;
          // If positions are equal, use creation date
          const dateA = new Date((a as any).createdAt).getTime();
          const dateB = new Date((b as any).createdAt).getTime();
          return dateB - dateA;
        })[0];

      const contextData = (latestRender as any).contextData;
      return contextData?.tldrawCanvasState || null;
    } catch (error) {
      logger.error('❌ CanvasService: Failed to get chain canvas state', error);
      return null;
    }
  }

  /**
   * Save canvas state to chain (saves to latest render in chain)
   * This ensures chain-level state is always up to date
   * If no renders exist, state is saved to local storage only (via persistenceKey)
   */
  async saveChainCanvasState(
    chainId: string,
    canvasState: CanvasState
  ): Promise<void> {
    try {
      // Get all renders for this chain
      const renders = await RendersDAL.getByChainId(chainId);
      
      // If no renders exist, skip database save (state is saved via persistenceKey)
      if (!renders || renders.length === 0) {
        logger.log('⚠️ CanvasService: No renders in chain, skipping DB save (using persistenceKey only)', { chainId });
        return; // Don't throw error - state is saved via persistenceKey
      }

      // Get latest render (highest chainPosition)
      const latestRender = renders
        .sort((a, b) => {
          const posA = (a as any).chainPosition ?? -1;
          const posB = (b as any).chainPosition ?? -1;
          if (posA !== posB) return posB - posA;
          const dateA = new Date((a as any).createdAt).getTime();
          const dateB = new Date((b as any).createdAt).getTime();
          return dateB - dateA;
        })[0];

      // Save to latest render
      await this.saveCanvasState(latestRender.id, canvasState);
      
      logger.log('✅ CanvasService: Saved chain canvas state', { chainId, renderId: latestRender.id });
    } catch (error) {
      logger.error('❌ CanvasService: Failed to save chain canvas state', error);
      // Don't throw - allow local persistence to work even if DB save fails
      logger.warn('⚠️ CanvasService: Continuing with local persistence only');
    }
  }

  /**
   * Update canvas metadata (viewport, zoom, etc.)
   */
  async updateCanvasMetadata(
    renderId: string,
    metadata: Partial<CanvasMetadata>
  ): Promise<void> {
    try {
      const render = await RendersDAL.getById(renderId);
      if (!render) {
        throw new Error(`Render ${renderId} not found`);
      }

      const existingMetadata = (render as any).metadata || {};
      
      await RendersDAL.update(renderId, {
        metadata: {
          ...existingMetadata,
          tldrawCanvas: {
            ...existingMetadata.tldrawCanvas,
            ...metadata,
            lastModified: new Date().toISOString(),
          },
        },
      } as any);

      logger.log('✅ CanvasService: Updated canvas metadata', { renderId });
    } catch (error) {
      logger.error('❌ CanvasService: Failed to update canvas metadata', error);
      throw error;
    }
  }
}

// Export singleton instance
export const canvasService = CanvasService.getInstance();

// Re-export types for convenience
import type { CanvasMetadata } from '@/lib/types/render';
export type { CanvasState, CanvasLayer, CanvasMask, CanvasMetadata };

