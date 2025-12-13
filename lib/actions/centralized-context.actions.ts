'use server';

import { CentralizedContextService, type UnifiedContext, type ContextRequest } from '@/lib/services/centralized-context-service';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';

/**
 * Centralized Context Actions
 * 
 * Server actions for building unified context
 * This is the single source of truth for context management
 * 
 * ✅ SERVER-ONLY: Must be called from server components or server actions
 */
export async function buildUnifiedContextAction(
  request: ContextRequest
): Promise<{ success: boolean; data?: UnifiedContext; error?: string }> {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const context = await CentralizedContextService.buildUnifiedContext(request);

    return {
      success: true,
      data: context,
    };
  } catch (error) {
    logger.error('Failed to build unified context:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build unified context',
    };
  }
}

/**
 * Get final prompt from unified context (server-side helper)
 */
export async function getFinalPromptAction(
  context: UnifiedContext,
  originalPrompt: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const finalPrompt = CentralizedContextService.getFinalPrompt(context, originalPrompt);
    return {
      success: true,
      data: finalPrompt,
    };
  } catch (error) {
    logger.error('Failed to get final prompt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get final prompt',
    };
  }
}

/**
 * Get reference render ID from unified context (server-side helper)
 */
export async function getReferenceRenderIdAction(
  context: UnifiedContext,
  chainRenders?: Array<{ id: string; status: string; chainPosition?: number | null }>,
  hasNewUploadedImage?: boolean
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const referenceRenderId = CentralizedContextService.getReferenceRenderId(
      context,
      chainRenders as any, // Type assertion needed for compatibility
      hasNewUploadedImage
    );
    return {
      success: true,
      data: referenceRenderId,
    };
  } catch (error) {
    logger.error('Failed to get reference render ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get reference render ID',
    };
  }
}

