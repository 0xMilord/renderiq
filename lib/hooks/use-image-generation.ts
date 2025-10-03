'use client';

import { useState } from 'react';
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
    projectId?: string;
  }) => {
    try {
      console.log('🚀 Starting image generation via API');
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

      if (params.projectId) {
        formData.append('projectId', params.projectId);
      }

      console.log('📤 Sending request to API:', { 
        prompt: params.prompt, 
        style: params.style, 
        type: params.type,
        hasImage: !!params.uploadedImage 
      });

      const response = await fetch('/api/renders', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('📥 API response:', data);

      if (response.ok && data.success) {
        // Convert API response to expected format
        const imageResult: ImageGenerationResult = {
          imageUrl: data.data.outputUrl,
          prompt: params.prompt,
          style: params.style,
          quality: params.quality,
          aspectRatio: params.aspectRatio,
          processingTime: data.data.processingTime || 0,
          provider: data.data.provider || 'gemini-2.5-flash-image',
        };
        setResult(imageResult);
        console.log('✅ Generation successful');
      } else {
        setError(data.error || 'Generation failed');
        console.error('❌ Generation failed:', data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('❌ Generation error:', errorMessage);
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
