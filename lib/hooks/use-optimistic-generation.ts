'use client';

import { useState, useCallback } from 'react';
// ImageGenerationResult type definition
export interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  style: string;
  quality: string;
  aspectRatio: string;
  processingTime: number;
  provider: string;
}
import { logger } from '@/lib/utils/logger';

export interface OptimisticRender {
  id: string;
  status: 'generating' | 'completed' | 'failed';
  prompt: string;
  style: string;
  quality: string;
  aspectRatio: string;
  imageUrl?: string;
  error?: string;
  createdAt: Date;
  processingTime?: number;
  provider?: string;
}

interface GenerationParams {
  prompt: string;
  style: string;
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  type: 'image' | 'video';
  duration?: number;
  uploadedImage?: File;
  projectId?: string;
  chainId?: string;
  referenceRenderId?: string;
  negativePrompt?: string;
  imageType?: string;
  isPublic?: boolean;
  seed?: number;
}

export function useOptimisticGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [optimisticRenders, setOptimisticRenders] = useState<OptimisticRender[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert File to base64
  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const generate = async (params: GenerationParams, onResult?: (result: ImageGenerationResult) => void) => {
    const tempId = `temp-${Date.now()}`;
    
    // Create optimistic render
    const optimisticRender: OptimisticRender = {
      id: tempId,
      status: 'generating',
      prompt: params.prompt,
      style: params.style,
      quality: params.quality,
      aspectRatio: params.aspectRatio,
      createdAt: new Date(),
    };

    try {
      logger.log('🚀 Starting optimistic image generation');
      setIsGenerating(true);
      setError(null);

      // Add optimistic render to UI immediately
      setOptimisticRenders(prev => [optimisticRender, ...prev]);

      // Save generation parameters to localStorage
      saveGenerationParams(params);

      // ✅ OPTIMIZED: Use server action instead of API route
      const { createRenderAction } = await import('@/lib/actions/render.actions');
      
      const formData = new FormData();
      formData.append('prompt', params.prompt);
      formData.append('style', params.style);
      formData.append('quality', params.quality);
      formData.append('aspectRatio', params.aspectRatio);
      formData.append('type', params.type);
      
      if (params.duration) {
        formData.append('duration', params.duration.toString());
      }
      
      if (params.uploadedImage) {
        const base64Image = await convertFileToBase64(params.uploadedImage);
        formData.append('uploadedImageData', base64Image);
        formData.append('uploadedImageType', params.uploadedImage.type);
      }

      if (params.projectId) {
        formData.append('projectId', params.projectId);
      }

      if (params.chainId) {
        formData.append('chainId', params.chainId);
      }

      if (params.referenceRenderId) {
        formData.append('referenceRenderId', params.referenceRenderId);
      }
      
      if (params.negativePrompt) {
        formData.append('negativePrompt', params.negativePrompt);
      }
      
      if (params.imageType) {
        formData.append('imageType', params.imageType);
      }

      if (params.isPublic !== undefined) {
        formData.append('isPublic', params.isPublic.toString());
      }

      if (params.seed !== undefined) {
        formData.append('seed', params.seed.toString());
      }

      logger.log('📤 Sending optimistic request via server action');

      // ✅ OPTIMIZED: Use server action instead of API route
      const { createRenderAction } = await import('@/lib/actions/render.actions');
      const data = await createRenderAction(formData);
      logger.log('📥 Server action response:', data);

      if (data.success) {
        // Update optimistic render with success
        const successRender: OptimisticRender = {
          ...optimisticRender,
          status: 'completed',
          imageUrl: data.data.outputUrl,
          processingTime: data.data.processingTime || 0,
          provider: data.data.provider || 'gemini-2.5-flash-image',
        };

        setOptimisticRenders(prev => 
          prev.map(render => render.id === tempId ? successRender : render)
        );

        // Cache successful render
        cacheSuccessfulRender(successRender);

        // Convert to expected format and call callback
        const imageResult: ImageGenerationResult = {
          imageUrl: data.data.outputUrl,
          prompt: params.prompt,
          style: params.style,
          quality: params.quality,
          aspectRatio: params.aspectRatio,
          processingTime: data.data.processingTime || 0,
          provider: data.data.provider || 'gemini-2.5-flash-image',
        };

        onResult?.(imageResult);
        logger.log('✅ Optimistic generation successful');
      } else {
        // Update optimistic render with failure
        const failedRender: OptimisticRender = {
          ...optimisticRender,
          status: 'failed',
          error: data.error || 'Generation failed',
        };

        setOptimisticRenders(prev => 
          prev.map(render => render.id === tempId ? failedRender : render)
        );

        setError(data.error || 'Generation failed');
        console.error('❌ Optimistic generation failed:', data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      // Update optimistic render with error
      const errorRender: OptimisticRender = {
        ...optimisticRender,
        status: 'failed',
        error: errorMessage,
      };

      setOptimisticRenders(prev => 
        prev.map(render => render.id === tempId ? errorRender : render)
      );

      setError(errorMessage);
      console.error('❌ Optimistic generation error:', errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearOptimisticRenders = () => {
    setOptimisticRenders([]);
  };

  const removeOptimisticRender = (id: string) => {
    setOptimisticRenders(prev => prev.filter(render => render.id !== id));
  };

  return {
    generate,
    isGenerating,
    optimisticRenders,
    error,
    clearOptimisticRenders,
    removeOptimisticRender,
  };
}

// localStorage utilities
export function saveGenerationParams(params: Partial<GenerationParams>) {
  try {
    localStorage.setItem('generation-params', JSON.stringify(params));
  } catch (error) {
    console.warn('Failed to save generation params to localStorage:', error);
  }
}

export function loadGenerationParams(): Partial<GenerationParams> | null {
  try {
    const saved = localStorage.getItem('generation-params');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load generation params from localStorage:', error);
    return null;
  }
}

export function cacheSuccessfulRender(render: OptimisticRender) {
  try {
    const cached = getCachedRenders();
    const newCached = [render, ...cached].slice(0, 50); // Keep last 50 renders
    localStorage.setItem('cached-renders', JSON.stringify(newCached));
  } catch (error) {
    console.warn('Failed to cache render:', error);
  }
}

export function getCachedRenders(): OptimisticRender[] {
  try {
    const cached = localStorage.getItem('cached-renders');
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.warn('Failed to get cached renders:', error);
    return [];
  }
}

export function clearCachedRenders() {
  try {
    localStorage.removeItem('cached-renders');
  } catch (error) {
    console.warn('Failed to clear cached renders:', error);
  }
}
