import { VideoPromptOptimizer, VideoDesignIntent } from './video-prompt-optimizer';
import { ImageUnderstandingService, ImageAnalysis } from './image-understanding';
import { ModelRouter } from './model-router';
import { AISDKService } from './ai-sdk-service';
import { logger } from '@/lib/utils/logger';
import { VideoModelId } from '@/lib/config/models';

/**
 * Video Pipeline - Complete Orchestrator for Video Generation Pipeline
 * 
 * Orchestrates all 7 stages of the technical moat for video generation:
 * 1. Semantic Parsing (video-specific)
 * 2. Image Understanding (reference images)
 * 3. Prompt Optimization
 * 4. Model Routing
 * 5. Video Generation
 * 6. Validation (optional)
 * 7. Memory Extraction (optional)
 */
export interface VideoPipelineRequest {
  prompt: string;
  referenceImages?: Array<{ imageData: string; imageType: string }>;
  firstFrameImage?: { imageData: string; imageType: string };
  lastFrameImage?: { imageData: string; imageType: string };
  previousVideo?: { videoData: string; videoType: string };
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: '16:9' | '9:16';
  durationSeconds?: 4 | 6 | 8;
  chainId?: string;
  // Optional: Skip certain stages for faster processing
  skipStages?: {
    imageUnderstanding?: boolean;
    validation?: boolean;
    memoryExtraction?: boolean;
  };
  // Optional: Force model selection (overrides routing)
  forceModel?: VideoModelId;
}

export interface VideoPipelineResult {
  success: boolean;
  data?: {
    operationName: string;
    operation: any;
    designIntent?: VideoDesignIntent;
    imageAnalysis?: ImageAnalysis;
    selectedModel?: VideoModelId;
  };
  error?: string;
}

export class VideoPipeline {
  private static aiService = AISDKService.getInstance();

  /**
   * Complete video generation pipeline with all stages
   */
  static async generateVideo(
    request: VideoPipelineRequest
  ): Promise<VideoPipelineResult> {
    const startTime = Date.now();
    const stageEvents: Array<{ stage: string; status: 'success' | 'failed'; durationMs: number }> = [];
    const recordStage = (stage: string, status: 'success' | 'failed', startedAt: number) => {
      stageEvents.push({ stage, status, durationMs: Date.now() - startedAt });
    };

    try {
      logger.log('🚀 VideoPipeline: Starting full video pipeline', {
        hasReferenceImages: !!request.referenceImages?.length,
        hasFirstFrame: !!request.firstFrameImage,
        hasLastFrame: !!request.lastFrameImage,
        hasPreviousVideo: !!request.previousVideo,
        quality: request.quality
      });

      let imageAnalysis: ImageAnalysis | undefined;
      let optimizedPrompt: string = request.prompt;
      let designIntent: VideoDesignIntent | undefined;
      let selectedModel: VideoModelId;

      // STAGE 2: Image Understanding (if reference images exist and not skipped)
      // ✅ OPTIMIZED: Analyze all reference images in parallel (up to 3 for Veo)
      const stage2Start = Date.now();
      if (!request.skipStages?.imageUnderstanding && request.referenceImages && request.referenceImages.length > 0) {
        try {
          // Analyze all reference images in parallel (Veo supports up to 3)
          const imageAnalyses = await Promise.all(
            request.referenceImages.slice(0, 3).map(img =>
              ImageUnderstandingService.analyzeReferenceImage(
                img.imageData,
                img.imageType
              ).catch(error => {
                logger.error('⚠️ VideoPipeline: Failed to analyze reference image', error);
                return null;
              })
            )
          );

          // Use first successful analysis (or merge them in the future)
          imageAnalysis = imageAnalyses.find(analysis => analysis !== null) || undefined;
          
          if (imageAnalysis) {
            logger.log('✅ VideoPipeline: Stage 2 (Image Understanding) complete', {
              analyzedImages: imageAnalyses.filter(a => a !== null).length,
              totalImages: request.referenceImages.length
            });
            recordStage('image_understanding', 'success', stage2Start);
          }
        } catch (error) {
          recordStage('image_understanding', 'failed', stage2Start);
          logger.error('⚠️ VideoPipeline: Stage 2 failed, continuing', error);
        }
      }

      // STAGE 3: Prompt Optimization
      const stage3Start = Date.now();
      try {
        const optimization = await VideoPromptOptimizer.optimizeVideoPrompt(
          request.prompt,
          request.referenceImages,
          undefined // Previous video analysis can be added later
        );
        optimizedPrompt = optimization.optimizedPrompt;
        designIntent = optimization.designIntent;
        logger.log('✅ VideoPipeline: Stage 3 (Prompt Optimization) complete');
        recordStage('prompt_optimization', 'success', stage3Start);
      } catch (error) {
        recordStage('prompt_optimization', 'failed', stage3Start);
        logger.error('⚠️ VideoPipeline: Stage 3 failed, using original prompt', error);
      }

      // STAGE 4: Model Routing
      const stage4Start = Date.now();
      // Use ModelRouter if forceModel is "auto" or not provided
      // If a specific model is provided (not "auto"), use it directly
      if (request.forceModel && request.forceModel !== 'auto') {
        selectedModel = request.forceModel;
        logger.log('🎯 VideoPipeline: Using user-selected model:', selectedModel);
        recordStage('model_routing', 'success', stage4Start);
      } else {
        // Use ModelRouter for automatic selection (when forceModel is "auto" or undefined)
        selectedModel = ModelRouter.selectVideoModel(
          request.quality,
          designIntent?.complexity
        );
        logger.log('✅ VideoPipeline: Stage 4 (Model Routing) complete - Auto-selected:', selectedModel);
        recordStage('model_routing', 'success', stage4Start);
      }

      // STAGE 5: Video Generation (expensive model)
      const durationSeconds = request.durationSeconds || 8;
      const resolution = request.quality === 'ultra' ? '1080p' : '720p';

      logger.log('🎬 VideoPipeline: Stage 5 (Video Generation) starting', {
        model: selectedModel,
        resolution,
        durationSeconds,
        promptLength: optimizedPrompt.length
      });

      // Build video generation config
      const videoConfig: any = {
        model: selectedModel,
        aspectRatio: request.aspectRatio,
        resolution,
        durationSeconds
      };

      // Add reference images if provided
      if (request.referenceImages && request.referenceImages.length > 0) {
        videoConfig.referenceImages = request.referenceImages.slice(0, 3).map(img => ({
          imageData: img.imageData,
          imageType: img.imageType,
          referenceType: 'asset' as const
        }));
      }

      // Add first/last frame images if provided
      if (request.firstFrameImage) {
        videoConfig.firstFrameImage = request.firstFrameImage;
      }

      if (request.lastFrameImage) {
        videoConfig.lastFrameImage = request.lastFrameImage;
      }

      // Add previous video if provided (for extension)
      if (request.previousVideo) {
        videoConfig.previousVideo = request.previousVideo;
      }

      // Generate video using AISDKService
      // Note: generateVideo returns an operation that needs polling
      const generationResult = await this.aiService.generateVideo({
        prompt: optimizedPrompt,
        duration: durationSeconds,
        durationSeconds: durationSeconds,
        aspectRatio: request.aspectRatio,
        model: selectedModel,
        resolution: resolution,
        ...(request.referenceImages && request.referenceImages.length > 0 && {
          referenceImages: request.referenceImages.map(img => ({
            imageData: img.imageData,
            imageType: img.imageType,
            referenceType: 'asset' as const
          }))
        }),
        ...(request.firstFrameImage && {
          firstFrameImage: request.firstFrameImage
        }),
        ...(request.lastFrameImage && {
          lastFrameImage: request.lastFrameImage
        }),
        ...(request.previousVideo && {
          previousVideo: request.previousVideo
        })
      });

      if (!generationResult.success || !generationResult.data) {
        recordStage('video_generation', 'failed', stage5Start);
        logger.error('❌ VideoPipeline: Stage 5 (Video Generation) failed', generationResult.error);
        return {
          success: false,
          error: generationResult.error || 'Video generation failed'
        };
      }

      logger.log('✅ VideoPipeline: Stage 5 (Video Generation) complete', {
        operationName: generationResult.data.operationName
      });
      recordStage('video_generation', 'success', stage5Start);

      const totalProcessingTime = Date.now() - startTime;
      logger.log('🎉 VideoPipeline: Complete pipeline finished', {
        totalTime: `${totalProcessingTime}ms`,
        operationName: generationResult.data.operationName
      });

      return {
        success: true,
        data: {
          operationName: generationResult.data.operationName,
          operation: generationResult.data.metadata?.operation,
          designIntent,
          imageAnalysis,
          selectedModel,
          stageEvents,
          // Include video data if generation completed synchronously (unlikely)
          ...(generationResult.data.videoData && {
            videoUrl: generationResult.data.videoUrl,
            videoData: generationResult.data.videoData
          })
        }
      };

    } catch (error) {
      logger.error('❌ VideoPipeline: Pipeline failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pipeline failed'
      };
    }
  }

  /**
   * Quick video generation (skips expensive stages for faster processing)
   * Skips: image understanding, validation, memory extraction
   */
  static async quickGenerate(
    request: Omit<VideoPipelineRequest, 'skipStages'>
  ): Promise<VideoPipelineResult> {
    return this.generateVideo({
      ...request,
      skipStages: {
        imageUnderstanding: true,
        validation: true,
        memoryExtraction: true
      }
    });
  }
}

