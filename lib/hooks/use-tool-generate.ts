import { useState } from 'react';
import { toast } from 'sonner';
import { useCredits } from './use-credits';

export interface GenerateResult {
  success: boolean;
  data?: { renderId: string; outputUrl: string; label?: string } | Array<{ renderId: string; outputUrl: string; label?: string }>;
  error?: string;
}

export type GenerateHandler = (formData: FormData) => Promise<GenerateResult | void>;

interface UseToolGenerateOptions {
  projectId: string | null;
  creditsCost: number;
  onSuccess?: (result: GenerateResult['data']) => void;
  onError?: (error: string) => void;
}

export function useToolGenerate({ projectId, creditsCost, onSuccess, onError }: UseToolGenerateOptions) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { credits, refreshCredits } = useCredits();

  const generate = async (
    formData: FormData,
    customHandler?: GenerateHandler
  ): Promise<GenerateResult | void> => {
    if (!projectId) {
      const err = 'Please select a project first';
      setError(err);
      toast.error('Please select a project before generating');
      onError?.(err);
      return;
    }

    if (credits && credits.balance < creditsCost) {
      const err = `Insufficient credits. You need ${creditsCost} credits but have ${credits.balance}.`;
      setError(err);
      toast.error('Insufficient credits');
      onError?.(err);
      return;
    }

    setError(null);
    setLoading(true);
    setProgress(0);

    try {
      if (customHandler) {
        setProgress(30);
        const result = await customHandler(formData);
        setProgress(70);
        
        if (result && result.success && result.data) {
          setProgress(100);
          await refreshCredits();
          toast.success(Array.isArray(result.data)
            ? `${result.data.length} renders generated successfully!`
            : 'Render generated successfully!');
          onSuccess?.(result.data);
          return result;
        } else if (result && !result.success) {
          throw new Error(result.error || 'Failed to generate render');
        } else {
          await refreshCredits();
          setProgress(100);
          return;
        }
      }

      // Default handler would go here if needed
      throw new Error('No generate handler provided');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate render';
      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return {
    generate,
    loading,
    progress,
    error,
    canGenerate: !!projectId && (!credits || credits.balance >= creditsCost),
  };
}

