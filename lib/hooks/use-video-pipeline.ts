'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

/**
 * Hook for using the Technical Moat Video Pipeline
 * Handles async video generation with operation polling
 */
export interface UseVideoPipelineOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onProgress?: (status: string) => void;
  enableFullPipeline?: boolean;
}

export interface VideoPipelineRequest {
  prompt: string;
  referenceImages?: Array<{ imageData: string; imageType: string }>;
  firstFrameImage?: { imageData: string; imageType: string };
  lastFrameImage?: { imageData: string; imageType: string };
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: '16:9' | '9:16';
  durationSeconds?: 4 | 6 | 8;
  chainId?: string;
  projectId: string;
  generationType?: 'text-to-video' | 'image-to-video' | 'keyframe-sequence';
}

export function useVideoPipeline(options: UseVideoPipelineOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateVideo = useCallback(async (request: VideoPipelineRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setOperationName(null);

    try {
      logger.log('🚀 useVideoPipeline: Starting video generation', {
        hasReferenceImages: !!request.referenceImages?.length,
        quality: request.quality,
        useFullPipeline: options.enableFullPipeline
      });

      // Build form data
      const formData = new FormData();
      formData.append('prompt', request.prompt);
      formData.append('duration', String(request.durationSeconds || 8));
      formData.append('aspectRatio', request.aspectRatio);
      formData.append('projectId', request.projectId);
      formData.append('generationType', request.generationType || 'text-to-video');
      
      if (request.chainId) {
        formData.append('chainId', request.chainId);
      }

      // Add reference images if provided
      if (request.referenceImages && request.referenceImages.length > 0) {
        formData.append('keyframeCount', String(request.referenceImages.length));
        request.referenceImages.forEach((img, i) => {
          // Convert base64 to blob for FormData
          const byteCharacters = atob(img.imageData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: img.imageType });
          formData.append(`keyframe_${i}`, blob, `keyframe_${i}.${img.imageType.split('/')[1]}`);
        });
      }

      if (request.firstFrameImage) {
        const byteCharacters = atob(request.firstFrameImage.imageData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: request.firstFrameImage.imageType });
        formData.append('uploadedImage', blob, 'firstFrame.png');
      }

      // Add full pipeline flag if enabled
      const url = options.enableFullPipeline 
        ? '/api/video?fullPipeline=true'
        : '/api/video';

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.operationName) {
        // Async operation - start polling
        setOperationName(data.operationName);
        setPolling(true);
        options.onProgress?.('processing');
        
        // Poll for completion
        await pollVideoOperation(data.operationName);
      } else if (data.success && data.videoUrl) {
        // Synchronous completion (unlikely but handle it)
        setResult(data);
        options.onSuccess?.(data);
        logger.log('✅ useVideoPipeline: Video generation completed');
      } else {
        throw new Error(data.error || 'Video generation failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options.onError?.(errorMessage);
      logger.error('❌ useVideoPipeline: Video generation failed', err);
      setPolling(false);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const pollVideoOperation = useCallback(async (opName: string) => {
    const maxAttempts = 60; // 10 minutes max (10s intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/video?operationName=${encodeURIComponent(opName)}`);
        
        if (!response.ok) {
          throw new Error(`Polling failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'completed' && data.videoUrl) {
          setResult(data);
          setPolling(false);
          options.onSuccess?.(data);
          logger.log('✅ useVideoPipeline: Video generation completed');
          return;
        } else if (data.status === 'failed') {
          throw new Error(data.error || 'Video generation failed');
        }

        // Still processing
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        options.onProgress?.('processing');

      } catch (err) {
        setPolling(false);
        throw err;
      }
    }

    throw new Error('Video generation timed out');
  }, [options]);

  return {
    generateVideo,
    loading: loading || polling,
    error,
    result,
    operationName,
    polling
  };
}

