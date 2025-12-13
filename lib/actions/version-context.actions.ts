'use server';

// ✅ DEPRECATED: Use CentralizedContextService instead
// This file is kept for backward compatibility but redirects to CentralizedContextService
import { CentralizedContextService, type UnifiedContext } from '@/lib/services/centralized-context-service';
import { buildUnifiedContextAction } from './centralized-context.actions';
import type { ParsedPrompt, VersionContext } from '@/lib/services/version-context';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';

/**
 * @deprecated Use buildUnifiedContextAction from centralized-context.actions.ts instead
 * This function is kept for backward compatibility
 */
export async function parsePromptWithMentions(
  prompt: string,
  projectId?: string,
  chainId?: string
): Promise<{ success: boolean; data?: ParsedPrompt; error?: string }> {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // ✅ CENTRALIZED: Use CentralizedContextService
    const contextResult = await buildUnifiedContextAction({
      prompt,
      chainId,
      projectId,
      useVersionContext: prompt.includes('@'),
      useContextPrompt: false,
      usePipelineMemory: false,
    });

    if (!contextResult.success || !contextResult.data) {
      return {
        success: false,
        error: contextResult.error || 'Failed to build unified context',
      };
    }

    // Extract ParsedPrompt from UnifiedContext for backward compatibility
    const unifiedContext = contextResult.data;
    if (unifiedContext.versionContext) {
      return {
        success: true,
        data: unifiedContext.versionContext.parsedPrompt,
      };
    }

    // No mentions found
    return {
      success: true,
      data: {
        originalPrompt: prompt,
        userIntent: prompt,
        mentionedVersions: [],
        hasMentions: false,
      },
    };

  } catch (error) {
    logger.error('Failed to parse prompt with mentions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse prompt',
    };
  }
}

/**
 * @deprecated Use buildUnifiedContextAction from centralized-context.actions.ts instead
 * This function is kept for backward compatibility
 */
export async function getVersionContext(renderId: string): Promise<{ success: boolean; data?: VersionContext; error?: string }> {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // ✅ CENTRALIZED: Use CentralizedContextService
    const contextResult = await buildUnifiedContextAction({
      prompt: '',
      referenceRenderId: renderId,
      useVersionContext: false,
      useContextPrompt: false,
      usePipelineMemory: false,
    });

    if (!contextResult.success || !contextResult.data?.referenceRender) {
      return {
        success: false,
        error: 'Render not found',
      };
    }

    // Extract VersionContext from UnifiedContext for backward compatibility
    const render = contextResult.data.referenceRender;
    const context: VersionContext = {
      renderId: render.id,
      prompt: render.prompt || '',
      settings: render.settings || {},
      outputUrl: render.outputUrl || '',
      type: render.type,
      createdAt: render.createdAt,
      chainPosition: render.chainPosition || undefined,
      metadata: {
        processingTime: render.processingTime,
        provider: 'unknown',
        quality: render.settings?.quality || 'standard',
        style: render.settings?.style || 'realistic',
        aspectRatio: render.settings?.aspectRatio || '16:9',
        imageType: render.settings?.imageType || '3d-mass'
      }
    };

    return {
      success: true,
      data: context,
    };

  } catch (error) {
    logger.error('Failed to get version context:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get version context',
    };
  }
}
