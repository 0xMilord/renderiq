import { VersionContextService } from './version-context';
import { ContextPromptService } from './context-prompt';
import { PipelineMemoryService } from './pipeline-memory';
import { RendersDAL } from '@/lib/dal/renders';
import { RenderChainsDAL } from '@/lib/dal/render-chains';
import type { Render } from '@/lib/types/render';
import type { ChainContext } from '@/lib/types/render-chain';
import { logger } from '@/lib/utils/logger';
// ✅ SERVER-ONLY: Import types from types file (client-safe, no server code)
import type { UnifiedContext, ContextRequest, ParsedPrompt, VersionContext, PipelineMemory } from '@/lib/types/context';

// ✅ SERVER-ONLY: Re-export types for server-side use
// Client components should import from '@/lib/types/context' instead
export type { UnifiedContext, ContextRequest } from '@/lib/types/context';

export class CentralizedContextService {
  private static versionContextService = VersionContextService.getInstance();

  /**
   * Build unified context from all available sources
   * Aligns version context, context prompt, and pipeline memory
   */
  static async buildUnifiedContext(request: ContextRequest): Promise<UnifiedContext> {
    const startTime = Date.now();
    logger.log('🧠 CentralizedContextService: Building unified context', {
      hasChainId: !!request.chainId,
      hasReferenceRenderId: !!request.referenceRenderId,
      hasCanvasSelection: !!request.canvasSelectedRenderIds?.length
    });

    const context: UnifiedContext = {};

    try {
      // ✅ PARALLEL: Load all context sources in parallel for performance
      const [
        versionContextResult,
        chainContextResult,
        pipelineMemoryResult,
        referenceRenderResult
      ] = await Promise.all([
        // 1. Version Context (parse @mentions if enabled)
        request.useVersionContext && request.prompt.includes('@')
          ? this.loadVersionContext(request.prompt, request.projectId, request.chainId)
          : Promise.resolve(undefined),
        
        // 2. Chain Context (successful elements, evolution)
        request.chainId && request.useContextPrompt
          ? this.loadChainContext(request.chainId)
          : Promise.resolve(undefined),
        
        // 3. Pipeline Memory (from 7-stage technical moat)
        request.chainId && request.usePipelineMemory
          ? PipelineMemoryService.getMemoryFromChain(request.chainId)
          : Promise.resolve(undefined),
        
        // 4. Reference Render (for iterative editing)
        request.referenceRenderId
          ? RendersDAL.getById(request.referenceRenderId)
          : Promise.resolve(undefined)
      ]);

      // Assign results
      if (versionContextResult) {
        context.versionContext = versionContextResult;
      }

      if (chainContextResult) {
        context.chainContext = chainContextResult;
      }

      if (pipelineMemoryResult) {
        context.pipelineMemory = pipelineMemoryResult;
      }

      if (referenceRenderResult) {
        context.referenceRender = referenceRenderResult as Render;
      }

      // Build context prompt if requested
      if (request.useContextPrompt && context.referenceRender) {
        const contextPrompt = await ContextPromptService.buildContextAwarePrompt(
          request.prompt,
          context.referenceRender,
          context.chainContext
        );
        context.contextPrompt = contextPrompt;
      }

      // Canvas context (from canvas selection)
      if (request.canvasSelectedRenderIds && request.canvasSelectedRenderIds.length > 0) {
        context.canvasContext = {
          selectedRenderIds: request.canvasSelectedRenderIds
        };
      }

      const processingTime = Date.now() - startTime;
      logger.log('✅ CentralizedContextService: Unified context built', {
        processingTime: `${processingTime}ms`,
        hasVersionContext: !!context.versionContext,
        hasContextPrompt: !!context.contextPrompt,
        hasPipelineMemory: !!context.pipelineMemory,
        hasChainContext: !!context.chainContext,
        hasReferenceRender: !!context.referenceRender,
        hasCanvasContext: !!context.canvasContext
      });

      return context;
    } catch (error) {
      logger.error('❌ CentralizedContextService: Failed to build unified context', error);
      // Return partial context on error (graceful degradation)
      return context;
    }
  }

  /**
   * Load version context (parse @mentions)
   */
  private static async loadVersionContext(
    prompt: string,
    projectId?: string,
    chainId?: string
  ): Promise<{ parsedPrompt: ParsedPrompt; mentionedVersions: VersionContext[] } | undefined> {
    try {
      // Get user renders and chain renders
      const [userRenders, chainRenders] = await Promise.all([
        projectId
          ? RendersDAL.getByProjectId(projectId, 50)
          : Promise.resolve([]),
        chainId
          ? RendersDAL.getByChainId(chainId)
          : Promise.resolve([])
      ]);

      // Parse prompt with mentions
      const result = await this.versionContextService.parsePromptWithMentions(
        prompt,
        userRenders,
        chainRenders
      );

      if (result.success && result.data) {
        return {
          parsedPrompt: result.data,
          mentionedVersions: result.data.mentionedVersions
            .filter(mv => mv.context)
            .map(mv => mv.context!)
        };
      }

      return undefined;
    } catch (error) {
      logger.error('❌ CentralizedContextService: Failed to load version context', error);
      return undefined;
    }
  }

  /**
   * Load chain context (successful elements, evolution)
   */
  private static async loadChainContext(chainId: string): Promise<ChainContext | undefined> {
    try {
      const successfulElements = await ContextPromptService.extractSuccessfulElements(chainId);
      const chainEvolution = await ContextPromptService.buildChainContext(chainId);

      if (successfulElements.length > 0 || chainEvolution) {
        return {
          successfulElements,
          chainEvolution
        };
      }

      return undefined;
    } catch (error) {
      logger.error('❌ CentralizedContextService: Failed to load chain context', error);
      return undefined;
    }
  }

  /**
   * Get final prompt for generation
   * Combines version context, context prompt, and pipeline memory
   */
  static getFinalPrompt(context: UnifiedContext, originalPrompt: string): string {
    // Priority order:
    // 1. Context prompt (enhanced with chain context)
    // 2. Version context (parsed from mentions)
    // 3. Original prompt

    if (context.contextPrompt?.enhancedPrompt) {
      return context.contextPrompt.enhancedPrompt;
    }

    if (context.versionContext?.parsedPrompt?.userIntent) {
      return context.versionContext.parsedPrompt.userIntent;
    }

    return originalPrompt;
  }

  /**
   * Get reference render ID for generation
   * Priority: Canvas selection > Reference render > Mentioned version > Latest in chain
   * 
   * This is the single source of truth for reference render selection
   */
  static getReferenceRenderId(
    context: UnifiedContext,
    chainRenders?: Render[],
    hasNewUploadedImage?: boolean
  ): string | undefined {
    // Priority 1: Canvas selection (highest priority)
    if (context.canvasContext?.selectedRenderIds?.length > 0) {
      const selectedRenderId = context.canvasContext.selectedRenderIds[0];
      logger.log('🎨 CentralizedContextService: Using canvas-selected render as reference', {
        renderId: selectedRenderId
      });
      return selectedRenderId;
    }

    // Priority 2: Explicit reference render
    if (context.referenceRender?.id) {
      logger.log('🔗 CentralizedContextService: Using explicit reference render', {
        renderId: context.referenceRender.id
      });
      return context.referenceRender.id;
    }

    // Priority 3: Mentioned version (only if no new image uploaded)
    // If user uploads a new image, mentions are for style/material reference, not image reference
    if (!hasNewUploadedImage && context.versionContext?.mentionedVersions?.length > 0) {
      const mentionedVersionWithRender = context.versionContext.mentionedVersions
        .find(v => v.renderId);
      if (mentionedVersionWithRender?.renderId) {
        logger.log('🔗 CentralizedContextService: Using mentioned version as reference', {
          renderId: mentionedVersionWithRender.renderId
        });
        return mentionedVersionWithRender.renderId;
      }
    }

    // Priority 4: Latest completed render in chain (iterative edit)
    if (!hasNewUploadedImage && chainRenders && chainRenders.length > 0) {
      const completedRenders = chainRenders.filter(render => render.status === 'completed');
      const latestCompletedRender = completedRenders
        .sort((a, b) => (b.chainPosition || 0) - (a.chainPosition || 0))[0];
      
      if (latestCompletedRender) {
        logger.log('🔗 CentralizedContextService: Using latest completed render from chain', {
          renderId: latestCompletedRender.id
        });
        return latestCompletedRender.id;
      }
    }

    return undefined;
  }

  /**
   * Get reference image data for generation
   * Priority: Canvas selection > Reference render > Mentioned version
   */
  static async getReferenceImageData(
    context: UnifiedContext
  ): Promise<{ imageData?: string; imageType?: string; renderId?: string } | undefined> {
    // Priority 1: Canvas selection
    if (context.canvasContext?.selectedRenderIds?.length > 0) {
      const selectedRenderId = context.canvasContext.selectedRenderIds[0];
      const render = await RendersDAL.getById(selectedRenderId);
      if (render?.outputUrl) {
        // Download image (simplified - in production, use proper image fetching)
        return {
          renderId: selectedRenderId
        };
      }
    }

    // Priority 2: Reference render
    if (context.referenceRender?.outputUrl) {
      return {
        renderId: context.referenceRender.id
      };
    }

    // Priority 3: Mentioned version
    if (context.versionContext?.mentionedVersions?.length > 0) {
      const firstMentioned = context.versionContext.mentionedVersions[0];
      if (firstMentioned.imageData) {
        return {
          imageData: firstMentioned.imageData,
          imageType: 'image/png',
          renderId: firstMentioned.renderId
        };
      }
    }

    return undefined;
  }
}

