'use server';

import { VersionContextService, type ParsedPrompt, type VersionContext } from '@/lib/services/version-context';
import { getUserRenders } from './user-renders.actions';
import { getRenderChain } from './projects.actions';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';

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

    // ✅ OPTIMIZED: Parallelize user renders and chain renders fetch when chainId is provided
    const [userRendersResult, chainResult] = await Promise.all([
      getUserRenders(projectId, 50),
      chainId ? getRenderChain(chainId) : Promise.resolve({ success: false, data: null })
    ]);

    if (!userRendersResult.success) {
      return {
        success: false,
        error: userRendersResult.error || 'Failed to get user renders',
      };
    }

    // Get chain renders if chainId was provided and fetch was successful
    let chainRenders = undefined;
    if (chainId && chainResult.success && chainResult.data) {
      chainRenders = chainResult.data.renders;
    }

    const versionContextService = VersionContextService.getInstance();
    const result = await versionContextService.parsePromptWithMentions(
      prompt,
      userRendersResult.data || [],
      chainRenders
    );

    return result;

  } catch (error) {
    logger.error('Failed to parse prompt with mentions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse prompt',
    };
  }
}

export async function getVersionContext(renderId: string): Promise<{ success: boolean; data?: VersionContext; error?: string }> {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Get the render
    const { getUserRenderById } = await import('./user-renders.actions');
    const renderResult = await getUserRenderById(renderId);
    
    if (!renderResult.success || !renderResult.data) {
      return {
        success: false,
        error: renderResult.error || 'Render not found',
      };
    }

    const versionContextService = VersionContextService.getInstance();
    const context = await versionContextService['getVersionContext'](renderResult.data);

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
