'use client';

import { useState, useCallback } from 'react';
import { upscaleImageAction } from '@/lib/actions/upscaling.actions';

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
      console.log('🔍 useUpscaling: Starting upscaling', request);
      setIsUpscaling(true);
      setError(null);
      setUpscalingResult(null);

      const result = await upscaleImageAction(request);

      if (result.success && result.data) {
        setUpscalingResult(result.data);
        console.log('✅ useUpscaling: Upscaling completed', result.data);
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