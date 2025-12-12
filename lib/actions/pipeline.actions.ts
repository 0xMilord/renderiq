'use server';

import { RenderPipeline } from '@/lib/services/render-pipeline';
import { VideoPipeline } from '@/lib/services/video-pipeline';
import { logger } from '@/lib/utils/logger';
import { getUserFromAction } from '@/lib/utils/get-user-from-action';

/**
 * Server Actions for Technical Moat Pipeline
 * Provides type-safe server-side access to pipeline features
 */

/**
 * Generate render using full technical moat pipeline
 */
export async function generateRenderWithPipeline(
  request: {
    prompt: string;
    referenceImageData?: string;
    referenceImageType?: string;
    styleReferenceData?: string;
    styleReferenceType?: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    chainId?: string;
    projectId: string;
    toolContext?: { toolId?: string; toolName?: string };
    enableFullPipeline?: boolean;
  },
  userId?: string
) {
  try {
    const { userId: authUserId } = await getUserFromAction(userId);
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }

    logger.log('🚀 generateRenderWithPipeline: Starting pipeline render', {
      hasReferenceImage: !!request.referenceImageData,
      quality: request.quality,
      fullPipeline: request.enableFullPipeline
    });

    if (request.enableFullPipeline) {
      // Use full 7-stage pipeline
      const result = await RenderPipeline.generateRender({
        prompt: request.prompt,
        referenceImageData: request.referenceImageData,
        referenceImageType: request.referenceImageType,
        styleReferenceData: request.styleReferenceData,
        styleReferenceType: request.styleReferenceType,
        toolContext: request.toolContext,
        quality: request.quality,
        aspectRatio: request.aspectRatio,
        chainId: request.chainId,
        skipStages: {
          validation: request.quality === 'standard' // Skip validation for standard quality
        }
      });

      return result;
    } else {
      // Use quick render (skips expensive stages)
      const result = await RenderPipeline.quickRender({
        prompt: request.prompt,
        referenceImageData: request.referenceImageData,
        referenceImageType: request.referenceImageType,
        styleReferenceData: request.styleReferenceData,
        styleReferenceType: request.styleReferenceType,
        toolContext: request.toolContext,
        quality: request.quality,
        aspectRatio: request.aspectRatio,
        chainId: request.chainId
      });

      return result;
    }

  } catch (error) {
    logger.error('❌ generateRenderWithPipeline: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Pipeline failed'
    };
  }
}

/**
 * Generate video using full technical moat pipeline
 */
export async function generateVideoWithPipeline(
  request: {
    prompt: string;
    referenceImages?: Array<{ imageData: string; imageType: string }>;
    firstFrameImage?: { imageData: string; imageType: string };
    lastFrameImage?: { imageData: string; imageType: string };
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: '16:9' | '9:16';
    durationSeconds?: 4 | 6 | 8;
    chainId?: string;
    projectId: string;
    enableFullPipeline?: boolean;
  },
  userId?: string
) {
  try {
    const { userId: authUserId } = await getUserFromAction(userId);
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }

    logger.log('🚀 generateVideoWithPipeline: Starting pipeline video generation', {
      hasReferenceImages: !!request.referenceImages?.length,
      quality: request.quality,
      fullPipeline: request.enableFullPipeline
    });

    if (request.enableFullPipeline) {
      // Use full pipeline
      const result = await VideoPipeline.generateVideo({
        prompt: request.prompt,
        referenceImages: request.referenceImages,
        firstFrameImage: request.firstFrameImage,
        lastFrameImage: request.lastFrameImage,
        quality: request.quality,
        aspectRatio: request.aspectRatio,
        durationSeconds: request.durationSeconds,
        chainId: request.chainId,
        skipStages: {
          validation: true, // Skip validation for now
          memoryExtraction: true // Skip memory extraction for now
        }
      });

      return result;
    } else {
      // Use quick generation
      const result = await VideoPipeline.quickGenerate({
        prompt: request.prompt,
        referenceImages: request.referenceImages,
        firstFrameImage: request.firstFrameImage,
        lastFrameImage: request.lastFrameImage,
        quality: request.quality,
        aspectRatio: request.aspectRatio,
        durationSeconds: request.durationSeconds,
        chainId: request.chainId
      });

      return result;
    }

  } catch (error) {
    logger.error('❌ generateVideoWithPipeline: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Pipeline failed'
    };
  }
}

/**
 * Get pipeline memory from chain
 */
export async function getPipelineMemory(chainId: string, userId?: string) {
  try {
    const { userId: authUserId } = await getUserFromAction(userId);
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }

    const { PipelineMemoryService } = await import('@/lib/services/pipeline-memory');
    const memory = await PipelineMemoryService.getMemoryFromChain(chainId);

    return {
      success: true,
      data: memory
    };

  } catch (error) {
    logger.error('❌ getPipelineMemory: Failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get memory'
    };
  }
}

