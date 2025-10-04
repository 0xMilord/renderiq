'use client';

import { useState } from 'react';
import { parsePromptWithMentions } from '@/lib/actions/version-context.actions';
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

      const result = await parsePromptWithMentions(prompt, projectId, chainId);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to parse prompt');
        return null;
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
