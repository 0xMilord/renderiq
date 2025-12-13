import { SemanticParsingService, DesignIntent } from './semantic-parsing';
import { ImageUnderstandingService, ImageAnalysis } from './image-understanding';
import { PromptOptimizer } from './prompt-optimizer';
import { ModelRouter } from './model-router';
import { AISDKService } from './ai-sdk-service';
import { ImageValidator, ValidationResult } from './image-validator';
import { PipelineMemoryService, PipelineMemory } from './pipeline-memory';
import { logger } from '@/lib/utils/logger';
import { ImageModelId } from '@/lib/config/models';

/**
 * Render Pipeline - Complete Orchestrator for Technical Moat Pipeline
 * 
 * Orchestrates all 7 stages of the technical moat:
 * 1. Semantic Parsing
 * 2. Image Understanding
 * 3. Prompt Optimization
 * 4. Model Routing
 * 5. Image Generation
 * 6. Validation
 * 7. Memory Extraction
 * 
 * This is the main entry point for the full pipeline
 */
export interface RenderPipelineRequest {
  prompt: string;
  referenceImageData?: string;
  referenceImageType?: string;
  styleReferenceData?: string;
  styleReferenceType?: string;
  toolContext?: { toolId?: string; toolName?: string; toolSettings?: Record<string, string> };
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  chainId?: string;
  // Optional: Skip certain stages for faster processing
  skipStages?: {
    semanticParsing?: boolean;
    imageUnderstanding?: boolean;
    validation?: boolean;
    memoryExtraction?: boolean;
  };
  // Optional: Force model selection (overrides routing)
  forceModel?: ImageModelId;
  // NEW: Mask-based inpainting (for canvas mask tool)
  maskData?: string; // Base64 PNG mask (white = replace, black = keep)
  maskType?: 'inpaint' | 'outpaint' | 'replace';
  inpaintingPrompt?: string; // Specific prompt for masked region
  // NEW: Canvas context (optional)
  canvasContext?: {
    layers?: string[]; // Array of render IDs in layer order
    selectedLayer?: string;
    viewport?: { x: number; y: number; zoom: number };
  };
}

export interface RenderPipelineResult {
  success: boolean;
  data?: {
    imageUrl: string;
    imageData?: string;
    processingTime: number;
    provider: string;
    metadata: any;
    // Pipeline outputs
    designIntent?: DesignIntent;
    imageAnalysis?: ImageAnalysis;
    validation?: ValidationResult;
    pipelineMemory?: PipelineMemory;
    selectedModel?: ImageModelId;
    stageEvents?: Array<{ stage: string; status: 'success' | 'failed'; durationMs: number }>;
  };
  error?: string;
}

export class RenderPipeline {
  private static aiService = AISDKService.getInstance();

  /**
   * Complete render pipeline with all stages
   * Orchestrates the full 7-stage technical moat pipeline
   */
  static async generateRender(
    request: RenderPipelineRequest
  ): Promise<RenderPipelineResult> {
    const startTime = Date.now();

    try {
      logger.log('🚀 RenderPipeline: Starting full pipeline', {
        hasReferenceImage: !!request.referenceImageData,
        hasStyleReference: !!request.styleReferenceData,
        hasChainId: !!request.chainId,
        quality: request.quality
      });

      let designIntent: DesignIntent | undefined;
      let referenceAnalysis: ImageAnalysis | undefined;
      let styleAnalysis: { styleCharacteristics: string[]; visualElements: string[] } | undefined;
      let optimizedPrompt: string = request.prompt;
      let selectedModel: ImageModelId;
      let validation: ValidationResult | undefined;
      let pipelineMemory: PipelineMemory | undefined;
      const stageEvents: Array<{ stage: string; status: 'success' | 'failed'; durationMs: number }> = [];

      const recordStage = (stage: string, status: 'success' | 'failed', startedAt: number) => {
        stageEvents.push({ stage, status, durationMs: Date.now() - startedAt });
      };

      // ✅ OPTIMIZED: Parallelize Stage 1 (Semantic Parsing) and Memory Loading
      // They're independent operations, so we can run them simultaneously
      const [stage1Result, existingMemory] = await Promise.all([
        // STAGE 1: Semantic Parsing (if not skipped)
        !request.skipStages?.semanticParsing
          ? SemanticParsingService.parseDesignIntent(
              request.prompt,
              request.toolContext
            ).then(intent => {
              recordStage('semantic_parsing', 'success', startTime);
              logger.log('✅ RenderPipeline: Stage 1 (Semantic Parsing) complete');
              return intent;
            }).catch(error => {
              recordStage('semantic_parsing', 'failed', startTime);
              logger.error('⚠️ RenderPipeline: Stage 1 failed, continuing', error);
              return undefined;
            })
          : Promise.resolve(undefined),
        // Get pipeline memory for consistency (from chain if available)
        request.chainId
          ? PipelineMemoryService.getMemoryFromChain(request.chainId).then(memory => {
              if (memory) {
                logger.log('✅ RenderPipeline: Loaded pipeline memory from chain');
              }
              return memory || undefined;
            }).catch(error => {
              logger.error('⚠️ RenderPipeline: Failed to load memory, continuing', error);
              return undefined;
            })
          : Promise.resolve(undefined)
      ]);

      designIntent = stage1Result;

      // STAGE 2: Image Understanding (parallel if both images exist, if not skipped)
      if (!request.skipStages?.imageUnderstanding) {
        try {
          const [refAnalysis, styleAnalysisResult] = await Promise.all([
            request.referenceImageData
              ? ImageUnderstandingService.analyzeReferenceImage(
                  request.referenceImageData,
                  request.referenceImageType || 'image/png'
                )
              : Promise.resolve(undefined),
            request.styleReferenceData
              ? ImageUnderstandingService.analyzeStyleReference(
                  request.styleReferenceData,
                  request.styleReferenceType || 'image/png'
                )
              : Promise.resolve(undefined)
          ]);

          referenceAnalysis = refAnalysis;
          styleAnalysis = styleAnalysisResult;
          logger.log('✅ RenderPipeline: Stage 2 (Image Understanding) complete');
          recordStage('image_understanding', 'success', Date.now());
        } catch (error) {
          recordStage('image_understanding', 'failed', Date.now());
          logger.error('⚠️ RenderPipeline: Stage 2 failed, continuing', error);
        }
      }

      // STAGE 3: Prompt Optimization
      // Use enhanced PromptOptimizer if we have designIntent, otherwise use SimplePromptOptimizer
      if (designIntent) {
        const stageStart = Date.now();
        try {
          optimizedPrompt = await PromptOptimizer.optimizePrompt(
            request.prompt,
            designIntent,
            referenceAnalysis,
            styleAnalysis,
            request.toolContext,
            existingMemory
          );
          logger.log('✅ RenderPipeline: Stage 3 (Prompt Optimization) complete');
          recordStage('prompt_optimization', 'success', stageStart);
        } catch (error) {
          recordStage('prompt_optimization', 'failed', stageStart);
          logger.error('⚠️ RenderPipeline: Stage 3 failed, using original prompt', error);
        }
      } else {
        // Fallback to SimplePromptOptimizer if semantic parsing was skipped
        const stageStart = Date.now();
        try {
          const { SimplePromptOptimizer } = await import('@/lib/services/simple-prompt-optimizer');
          optimizedPrompt = await SimplePromptOptimizer.optimizePrompt(
            request.prompt,
            request.referenceImageData,
            request.referenceImageType,
            request.styleReferenceData,
            request.styleReferenceType
          );
          logger.log('✅ RenderPipeline: Stage 3 (Simple Prompt Optimization) complete');
          recordStage('prompt_optimization_simple', 'success', stageStart);
        } catch (error) {
          recordStage('prompt_optimization_simple', 'failed', stageStart);
          logger.error('⚠️ RenderPipeline: Stage 3 failed, using original prompt', error);
        }
      }

      // STAGE 4: Model Routing
      const stage4Start = Date.now();
      // Use ModelRouter if forceModel is "auto" or not provided
      // If a specific model is provided (not "auto"), use it directly
      if (request.forceModel && request.forceModel !== 'auto') {
        selectedModel = request.forceModel;
        logger.log('🎯 RenderPipeline: Using user-selected model:', selectedModel);
        recordStage('model_routing', 'success', stage4Start);
      } else {
        // Use ModelRouter for automatic selection (when forceModel is "auto" or undefined)
        selectedModel = ModelRouter.selectImageModel(
          request.quality,
          request.toolContext,
          designIntent?.complexity
        );
        logger.log('✅ RenderPipeline: Stage 4 (Model Routing) complete - Auto-selected:', selectedModel);
        recordStage('model_routing', 'success', stage4Start);
      }

      // STAGE 5: Image Generation (expensive model)
      const imageSize = request.quality === 'ultra' ? '4K' : request.quality === 'high' ? '2K' : '1K';
      
      logger.log('🎨 RenderPipeline: Stage 5 (Image Generation) starting', {
        model: selectedModel,
        imageSize,
        promptLength: optimizedPrompt.length,
        hasChainId: !!request.chainId
      });

      const stage5Start = Date.now();
      
      // Extract style/effect and environment from toolSettings if present
      // Prioritize 'style' over 'effect' (both come from unified chat interface, but 'style' is primary)
      const effect = request.toolContext?.toolSettings?.style || request.toolContext?.toolSettings?.effect;
      const environment = request.toolContext?.toolSettings?.environment;
      
      // For inpainting: use inpainting prompt if provided, otherwise use optimized prompt
      const finalPrompt = request.inpaintingPrompt || optimizedPrompt;
      
      // ✅ MULTI-TURN CHAT API: Use chat session for iterative edits (if chainId provided)
      // This provides automatic context preservation and faster iterative edits
      // Aligned with MULTI_TURN_IMAGE_EDITING_ALIGNMENT.md
      let generationResult: { success: boolean; data?: any; error?: string } | undefined;
      const hasReferenceImage = !!request.referenceImageData;
      let shouldUseChat = request.chainId && hasReferenceImage; // Use chat if chain exists and has reference
      
      if (shouldUseChat) {
        try {
          const { ChatSessionManager } = await import('./chat-session-manager');
          logger.log('💬 RenderPipeline: Using chat API for multi-turn editing', {
            chainId: request.chainId
          });
          
          // Get or create chat session
          const chatSessionId = await ChatSessionManager.getOrCreateChatSession(
            request.chainId,
            selectedModel,
            {
              aspectRatio: request.aspectRatio,
              imageSize
            }
          );

          // Send message in chat session (Google maintains conversation history automatically)
          generationResult = await this.aiService.sendChatMessage(
            chatSessionId,
            finalPrompt,
            request.referenceImageData,
            request.referenceImageType,
            {
              aspectRatio: request.aspectRatio,
              imageSize
            }
          );

          // Update chain's last chat turn
          await ChatSessionManager.incrementChatTurn(request.chainId);
          
          logger.log('✅ RenderPipeline: Chat API generation completed');
        } catch (chatError) {
          logger.error('⚠️ RenderPipeline: Chat API failed, falling back to generateImage()', chatError);
          // Fall through to regular generateImage() call
          shouldUseChat = false;
          generationResult = undefined;
        }
      }
      
      // Use regular generateImage() if chat API not used or failed
      if (!generationResult) {
        generationResult = await this.aiService.generateImage({
          prompt: finalPrompt,
          aspectRatio: request.aspectRatio,
          uploadedImageData: request.referenceImageData,
          uploadedImageType: request.referenceImageType,
          styleTransferImageData: request.styleReferenceData,
          styleTransferImageType: request.styleReferenceType,
          maskData: request.maskData, // Pass mask for inpainting
          model: selectedModel,
          imageSize: imageSize,
          effect: effect, // Pass effect to preserve output style (CAD vs photorealistic)
          environment: environment, // Pass environment if specified
        });
      }

      if (!generationResult.success || !generationResult.data) {
        recordStage('image_generation', 'failed', stage5Start);
        logger.error('❌ RenderPipeline: Stage 5 (Image Generation) failed', generationResult.error);
        return {
          success: false,
          error: generationResult.error || 'Image generation failed'
        };
      }

      logger.log('✅ RenderPipeline: Stage 5 (Image Generation) complete');
      recordStage('image_generation', 'success', stage5Start);

      // STAGE 6: Validation (if not skipped)
      // Enable validation for all quality levels to ensure architectural accuracy
      if (!request.skipStages?.validation) {
        const stage6Start = Date.now();
        try {
          validation = await ImageValidator.validateImage(
            generationResult.data.imageData!,
            'image/png',
            designIntent,
            referenceAnalysis
          );

          logger.log('✅ RenderPipeline: Stage 6 (Validation) complete', {
            valid: validation.valid,
            errors: validation.errors.length
          });
          recordStage('validation', 'success', stage6Start);

          // If validation fails and we have corrections, optionally regenerate
          // For now, we'll just log the validation result
          if (!validation.valid && validation.errors.length > 0) {
            logger.warn('⚠️ RenderPipeline: Validation found errors', validation.errors);
            // Could implement auto-retry here, but for now we'll just continue
          }
        } catch (error) {
          recordStage('validation', 'failed', stage6Start);
          logger.error('⚠️ RenderPipeline: Stage 6 failed, continuing', error);
        }
      }

      // STAGE 7: Post-Processing Analysis (Memory Extraction, if not skipped)
      if (!request.skipStages?.memoryExtraction && generationResult.data.imageData) {
        const stage7Start = Date.now();
        try {
          pipelineMemory = await PipelineMemoryService.extractMemory(
            generationResult.data.imageData,
            'image/png'
          );

          logger.log('✅ RenderPipeline: Stage 7 (Memory Extraction) complete');
          recordStage('memory_extraction', 'success', stage7Start);
        } catch (error) {
          recordStage('memory_extraction', 'failed', stage7Start);
          logger.error('⚠️ RenderPipeline: Stage 7 failed, continuing', error);
        }
      }

      const totalProcessingTime = Date.now() - startTime;
      logger.log('🎉 RenderPipeline: Complete pipeline finished', {
        totalTime: `${totalProcessingTime}ms`,
        stagesCompleted: [
          designIntent ? '1' : null,
          referenceAnalysis || styleAnalysis ? '2' : null,
          '3',
          '4',
          '5',
          validation ? '6' : null,
          pipelineMemory ? '7' : null
        ].filter(Boolean).join(',')
      });

      return {
        success: true,
        data: {
          ...generationResult.data,
          designIntent,
          imageAnalysis: referenceAnalysis,
          validation,
          pipelineMemory,
          selectedModel,
          processingTime: totalProcessingTime,
          stageEvents
        }
      };

    } catch (error) {
      logger.error('❌ RenderPipeline: Pipeline failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pipeline failed'
      };
    }
  }

  /**
   * Quick render (skips expensive stages for faster processing)
   * Skips: semantic parsing, validation, memory extraction
   */
  static async quickRender(
    request: Omit<RenderPipelineRequest, 'skipStages'>
  ): Promise<RenderPipelineResult> {
    return this.generateRender({
      ...request,
      skipStages: {
        semanticParsing: true,
        validation: true,
        memoryExtraction: true
      }
    });
  }
}

