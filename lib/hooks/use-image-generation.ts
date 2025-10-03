'use client';

import { useState } from 'react';
import { generateImage, generateVideo } from '@/lib/actions/image-generation.actions';
import { ImageGenerationResult } from '@/lib/services/image-generation';

export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (params: {
    prompt: string;
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    type: 'image' | 'video';
    duration?: number;
    uploadedImage?: File;
  }) => {
    try {
      setIsGenerating(true);
      setError(null);
      setResult(null);

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
        formData.append('uploadedImage', params.uploadedImage);
      }

      const response = params.type === 'video' 
        ? await generateVideo(formData)
        : await generateImage(formData);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsGenerating(false);
  };

  return {
    generate,
    reset,
    isGenerating,
    result,
    error,
  };
}
