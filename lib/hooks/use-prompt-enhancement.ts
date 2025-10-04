import { useState } from 'react';
import { PromptEnhancementService, PromptEnhancementResult } from '@/lib/services/prompt-enhancement';

export function usePromptEnhancement() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<PromptEnhancementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalPrompt, setOriginalPrompt] = useState<string | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);

  const enhancePrompt = async (prompt: string): Promise<PromptEnhancementResult | null> => {
    if (!prompt.trim()) {
      setError('Please provide a prompt to enhance');
      return null;
    }

    try {
      console.log('🚀 Starting prompt enhancement via API');
      setIsEnhancing(true);
      setError(null);
      setResult(null);
      setOriginalPrompt(prompt);

      const formData = new FormData();
      formData.append('prompt', prompt);

      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('📥 API response:', data);

      if (response.ok && data.success) {
        setResult(data.data);
        setIsEnhanced(true);
        console.log('✅ Enhancement successful');
        return data.data;
      } else {
        const errorMsg = data.error || 'Enhancement failed';
        setError(errorMsg);
        console.error('❌ Enhancement failed:', data.error);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('❌ Enhancement error:', errorMessage);
      return null;
    } finally {
      setIsEnhancing(false);
    }
  };

  const restoreOriginal = (): string | null => {
    if (originalPrompt) {
      setIsEnhanced(false);
      setResult(null);
      return originalPrompt;
    }
    return null;
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setOriginalPrompt(null);
    setIsEnhanced(false);
  };

  return {
    enhancePrompt,
    isEnhancing,
    result,
    error,
    originalPrompt,
    isEnhanced,
    restoreOriginal,
    reset
  };
}
