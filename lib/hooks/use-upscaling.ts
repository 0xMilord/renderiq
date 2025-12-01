'use client';

import { useState, useCallback } from 'react';
import { AISDKService } from '@/lib/services/ai-sdk-service';

export interface UpscalingRequest {
  imageUrl: string;
  scale: 2 | 4 | 10;
  quality: 'standard' | 'high' | 'ultra';
}

export interface UpscalingResult {
  imageUrl: string;
  originalUrl: string;
  scale: number;
  processingTime: number;
  provider: string;
}

export function useUpscaling() {
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscalingResult, setUpscalingResult] = useState<UpscalingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upscaleImage = useCallback(async (request: UpscalingRequest) => {
    try {
      console.log('🔍 useUpscaling: Starting upscaling with AI SDK', request);
      setIsUpscaling(true);
      setError(null);
      setUpscalingResult(null);

      // Use AI SDK service for upscaling
      const aiService = AISDKService.getInstance();
      
      // Convert image URL to base64 for processing
      const response = await fetch(request.imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      // Simple upscaling prompt
      const upscalingPrompt = `Upscale this image by ${request.scale}x to ${request.quality} quality`;

      // Use HIGH media resolution for upscaling to ensure maximum quality
      const result = await aiService.generateImage({
        prompt: upscalingPrompt,
        aspectRatio: '16:9', // Maintain aspect ratio
        uploadedImageData: base64,
        uploadedImageType: 'image/jpeg',
        mediaResolution: 'HIGH', // Use high resolution for upscaling to preserve details
      });

      if (result.success && result.data) {
        const upscalingResult: UpscalingResult = {
          imageUrl: result.data.imageUrl,
          originalUrl: request.imageUrl,
          scale: request.scale,
          processingTime: result.data.processingTime,
          provider: result.data.provider
        };
        
        setUpscalingResult(upscalingResult);
        console.log('✅ useUpscaling: Upscaling completed', upscalingResult);
      } else {
        setError(result.error || 'Upscaling failed');
        console.error('❌ useUpscaling: Upscaling failed', result.error);
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