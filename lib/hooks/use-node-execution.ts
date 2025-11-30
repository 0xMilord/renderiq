'use client';

import { useState, useCallback } from 'react';

interface GenerateImageParams {
  prompt: string;
  settings: {
    style: string;
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: string;
    negativePrompt?: string;
    seed?: number;
  };
  nodeId: string;
}

interface GenerateVariantsParams {
  sourceImageUrl: string;
  prompt?: string;
  count: number;
  settings: {
    variationStrength: number;
    style?: string;
    quality: 'standard' | 'high' | 'ultra';
  };
  nodeId: string;
}

export function useNodeExecution() {
  const [loading, setLoading] = useState(false);

  const generateImage = useCallback(async (params: GenerateImageParams) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.prompt,
          style: params.settings.style,
          quality: params.settings.quality,
          aspectRatio: params.settings.aspectRatio,
          negativePrompt: params.settings.negativePrompt,
          seed: params.settings.seed,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to generate image',
        };
      }

      if (result.data) {
        // The API returns imageUrl in the data
        const imageUrl = result.data.imageUrl || result.data.url;
        
        if (!imageUrl) {
          return {
            success: false,
            error: 'No image URL returned from generation',
          };
        }

        // Create render record via renders API (optional - don't block on this)
        try {
          const formData = new FormData();
          formData.append('prompt', params.prompt);
          formData.append('style', params.settings.style);
          formData.append('quality', params.settings.quality);
          formData.append('aspectRatio', params.settings.aspectRatio);
          formData.append('type', 'image');
          
          // Try to upload base64 image to storage if it's a data URL
          if (imageUrl.startsWith('data:')) {
            // For now, just use the data URL directly
            // In production, you'd upload to storage and get a URL
          }

          const renderResponse = await fetch('/api/renders', {
            method: 'POST',
            body: formData,
          });

          const renderResult = await renderResponse.json();
          
          return {
            success: true,
            data: {
              outputUrl: imageUrl,
              renderId: renderResult.data?.id,
              prompt: params.prompt,
              settings: params.settings,
            },
          };
        } catch (renderError) {
          // If render creation fails, still return the image
          console.error('Failed to create render record:', renderError);
          return {
            success: true,
            data: {
              outputUrl: imageUrl,
              prompt: params.prompt,
              settings: params.settings,
            },
          };
        }
      }

      return {
        success: false,
        error: 'No data returned from generation',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const enhancePrompt = useCallback(async (prompt: string) => {
    try {
      const response = await fetch('/api/ai/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enhance prompt',
      };
    }
  }, []);

  const generateVariants = useCallback(async (params: GenerateVariantsParams) => {
    setLoading(true);
    try {
      const response = await fetch('/api/canvas/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate variants',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generateImage,
    enhancePrompt,
    generateVariants,
    loading,
  };
}

