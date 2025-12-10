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
  baseImageData?: string | null; // Base64 image data for image-to-image
  baseImageType?: string | null; // MIME type
  projectId?: string; // Project ID for render creation
  fileId?: string; // Canvas file ID for render creation
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

interface GenerateVideoParams {
  prompt: string;
  duration: 4 | 6 | 8;
  aspectRatio: '16:9' | '9:16' | '1:1';
  nodeId: string;
  baseImageData?: string | null;
  baseImageType?: string | null;
  model?: string;
  projectId?: string; // Project ID for render creation
  fileId?: string; // Canvas file ID for render creation
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
          uploadedImageData: params.baseImageData || undefined,
          uploadedImageType: params.baseImageType || undefined,
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
          
          // ✅ CRITICAL: Include projectId and fileId for proper render creation
          if (params.projectId) {
            formData.append('projectId', params.projectId);
            console.log('✅ [Canvas] Creating render with projectId:', params.projectId);
          } else {
            console.warn('⚠️ [Canvas] No projectId provided for render creation');
          }
          if (params.fileId) {
            formData.append('fileId', params.fileId);
            formData.append('platform', 'canvas'); // Mark as canvas platform
            console.log('✅ [Canvas] Creating render with fileId:', params.fileId);
          } else {
            console.warn('⚠️ [Canvas] No fileId provided for render creation');
          }
          
          // Try to upload base64 image to storage if it's a data URL
          if (imageUrl.startsWith('data:')) {
            // For now, just use the data URL directly
            // In production, you'd upload to storage and get a URL
          }

          console.log('📊 [Canvas] Creating render record for image generation', {
            hasProjectId: !!params.projectId,
            hasFileId: !!params.fileId,
            promptLength: params.prompt.length,
          });

          const renderResponse = await fetch('/api/renders', {
            method: 'POST',
            body: formData,
          });

          const renderResult = await renderResponse.json();
          
          if (renderResult.success) {
            console.log('✅ [Canvas] Render record created successfully', {
              renderId: renderResult.data?.id,
              projectId: params.projectId,
              fileId: params.fileId,
            });
          } else {
            console.error('❌ [Canvas] Failed to create render record', {
              error: renderResult.error,
              projectId: params.projectId,
              fileId: params.fileId,
            });
          }
          
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

  const generateVideo = useCallback(async (params: GenerateVideoParams) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('prompt', params.prompt);
      formData.append('duration', String(params.duration));
      formData.append('aspectRatio', params.aspectRatio);
      formData.append('model', params.model || 'veo-3.1-generate-preview');
      formData.append('generationType', params.baseImageData ? 'image-to-video' : 'text-to-video');
      // ✅ CRITICAL: Use actual projectId and fileId for canvas renders
      if (params.projectId) {
        formData.append('projectId', params.projectId);
      }
      if (params.fileId) {
        formData.append('fileId', params.fileId);
        formData.append('platform', 'canvas'); // Mark as canvas platform
      }
      
      if (params.baseImageData) {
        // Handle both base64 data and URLs (from Image Node output)
        if (params.baseImageData.startsWith('data:') || params.baseImageData.startsWith('http')) {
          // It's a URL or data URL - fetch and convert to File
          try {
            const response = await fetch(params.baseImageData);
            const blob = await response.blob();
            const file = new File([blob], 'base-image.png', { type: params.baseImageType || 'image/png' });
            formData.append('uploadedImage', file);
          } catch (error) {
            console.error('Failed to fetch image for video generation:', error);
            // Fallback: try to use as-is if it's a data URL
            if (params.baseImageData.startsWith('data:')) {
              const base64Data = params.baseImageData.split(',')[1];
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: params.baseImageType || 'image/png' });
              const file = new File([blob], 'base-image.png', { type: params.baseImageType || 'image/png' });
              formData.append('uploadedImage', file);
            }
          }
        } else {
          // It's base64 data (from Image Input Node)
          const byteCharacters = atob(params.baseImageData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: params.baseImageType || 'image/png' });
          const file = new File([blob], 'base-image.png', { type: params.baseImageType || 'image/png' });
          formData.append('uploadedImage', file);
        }
      }

      const response = await fetch('/api/video', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to generate video',
        };
      }

      if (result.success && result.data) {
        const videoUrl = result.data.outputUrl || result.data.videoUrl || result.data.url;
        
        if (!videoUrl) {
          return {
            success: false,
            error: 'No video URL returned from generation',
          };
        }

        return {
          success: true,
          data: {
            outputUrl: videoUrl,
            renderId: result.data.renderId || result.data.id,
            prompt: params.prompt,
            settings: {
              duration: params.duration,
              aspectRatio: params.aspectRatio,
            },
          },
        };
      }

      return {
        success: false,
        error: 'No data returned from generation',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate video',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generateImage,
    enhancePrompt,
    generateVariants,
    generateVideo,
    loading,
  };
}

