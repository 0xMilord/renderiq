'use client';

/**
 * @deprecated Use buildUnifiedContextAction from centralized-context.actions.ts instead
 * This hook is kept for backward compatibility but uses CentralizedContextService internally
 */
import { useState } from 'react';
import { buildUnifiedContextAction } from '@/lib/actions/centralized-context.actions';
import type { ParsedPrompt } from '@/lib/services/version-context';

export function useVersionContext() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsePrompt = async (
    prompt: string,
    projectId?: string,
    chainId?: string
  ): Promise<ParsedPrompt | null> => {
    try {
      setLoading(true);
      setError(null);

      // ✅ CENTRALIZED: Use CentralizedContextService
      const contextResult = await buildUnifiedContextAction({
        prompt,
        chainId,
        projectId,
        useVersionContext: prompt.includes('@'),
        useContextPrompt: false,
        usePipelineMemory: false,
      });
      
      if (contextResult.success && contextResult.data?.versionContext) {
        return contextResult.data.versionContext.parsedPrompt;
      } else {
        // No mentions found - return empty ParsedPrompt
        return {
          originalPrompt: prompt,
          userIntent: prompt,
          mentionedVersions: [],
          hasMentions: false,
        };
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse prompt';
      setError(errorMessage);
      console.error('Failed to parse prompt with mentions:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    parsePrompt,
    loading,
    error,
    clearError
  };
}
