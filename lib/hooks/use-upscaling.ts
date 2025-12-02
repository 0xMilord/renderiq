'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

export interface UpscalingRequest {
  imageUrl: string;
  scale: 2 | 4 | 10;
  quality: 'standard' | 'high' | 'ultra';
  projectId: string;
  chainId?: string;
  referenceRenderId?: string;
  aspectRatio?: string;
}

export interface UpscalingResult {
  imageUrl: string;
  originalUrl: string;
  scale: number;
  processingTime: number;
  provider: string;
  renderId?: string;
  outputUrl?: string;
}

export function useUpscaling() {
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscalingResult, setUpscalingResult] = useState<UpscalingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upscaleImage = useCallback(async (request: UpscalingRequest) => {
    try {
      logger.log('🔍 useUpscaling: Starting upscaling via API', request);
      setIsUpscaling(true);
      setError(null);
      setUpscalingResult(null);

      // Convert image URL to base64 for processing
      const imageResponse = await fetch(request.imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      // Convert ArrayBuffer to base64 in browser
      const bytes = new Uint8Array(arrayBuffer);
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
      const base64 = btoa(binary);
      
      // Determine image type from URL or response
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      const imageType = contentType.startsWith('image/') ? contentType : 'image/jpeg';
      
      // Create upscaling prompt
      const upscalingPrompt = `Upscale this image by ${request.scale}x to ${request.quality} quality, maintaining all details and improving resolution`;

      // Call the renders API endpoint for upscaling
      const formData = new FormData();
      formData.append('prompt', upscalingPrompt);
      formData.append('style', 'realistic');
      formData.append('quality', request.quality);
      formData.append('aspectRatio', request.aspectRatio || '16:9');
      formData.append('type', 'image');
      formData.append('projectId', request.projectId);
      
      if (request.chainId) {
        formData.append('chainId', request.chainId);
      }
      
      if (request.referenceRenderId) {
        formData.append('referenceRenderId', request.referenceRenderId);
      }
      
      formData.append('uploadedImageData', base64);
      formData.append('uploadedImageType', imageType);
      formData.append('isPublic', 'true');
      formData.append('temperature', '0.5'); // Lower temperature for upscaling (more deterministic)

      const apiResponse = await fetch('/api/renders', {
        method: 'POST',
        body: formData,
      });

      const apiResult = await apiResponse.json();

      if (apiResult.success && apiResult.data) {
        const upscalingResult: UpscalingResult = {
          imageUrl: apiResult.data.outputUrl || '',
          originalUrl: request.imageUrl,
          scale: request.scale,
          processingTime: apiResult.data.processingTime || 0,
          provider: apiResult.data.provider || 'google-generative-ai',
          renderId: apiResult.data.renderId || apiResult.data.id,
          outputUrl: apiResult.data.outputUrl
        };
        
        setUpscalingResult(upscalingResult);
        logger.log('✅ useUpscaling: Upscaling completed', upscalingResult);
      } else {
        setError(apiResult.error || 'Upscaling failed');
        console.error('❌ useUpscaling: Upscaling failed', apiResult.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upscaling failed';
      setError(errorMessage);
      console.error('❌ useUpscaling: Exception', errorMessage);
    } finally {
      setIsUpscaling(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUpscalingResult(null);
    setError(null);
    setIsUpscaling(false);
  }, []);

  return {
    upscaleImage,
    isUpscaling,
    upscalingResult,
    error,
    reset
  };
}