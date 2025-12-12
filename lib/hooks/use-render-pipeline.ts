'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

/**
 * Hook for using the Technical Moat Render Pipeline
 * Provides access to full pipeline features with loading states
 */
export interface UseRenderPipelineOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  enableFullPipeline?: boolean; // Enable full 7-stage pipeline
}

export interface RenderPipelineRequest {
  prompt: string;
  referenceImageData?: string;
  referenceImageType?: string;
  styleReferenceData?: string;
  styleReferenceType?: string;
  quality: 'standard' | 'high' | 'ultra';
  aspectRatio: string;
  chainId?: string;
  projectId: string;
  toolContext?: { toolId?: string; toolName?: string };
}

export function useRenderPipeline(options: UseRenderPipelineOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const generateRender = useCallback(async (request: RenderPipelineRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      logger.log('🚀 useRenderPipeline: Starting render generation', {
        hasReferenceImage: !!request.referenceImageData,
        hasStyleReference: !!request.styleReferenceData,
        quality: request.quality,
        useFullPipeline: options.enableFullPipeline
      });

      // Build form data
      const formData = new FormData();
      formData.append('prompt', request.prompt);
      formData.append('quality', request.quality);
      formData.append('aspectRatio', request.aspectRatio);
      formData.append('projectId', request.projectId);
      formData.append('type', 'image');
      
      if (request.chainId) {
        formData.append('chainId', request.chainId);
      }

      if (request.referenceImageData) {
        formData.append('referenceRenderImageData', request.referenceImageData);
        formData.append('referenceRenderImageType', request.referenceImageType || 'image/png');
      }

      if (request.styleReferenceData) {
        formData.append('styleTransferImageData', request.styleReferenceData);
        formData.append('styleTransferImageType', request.styleReferenceType || 'image/png');
      }

      if (request.toolContext) {
        formData.append('toolId', request.toolContext.toolId || '');
        formData.append('toolName', request.toolContext.toolName || '');
      }

      // Add full pipeline flag if enabled
      const url = options.enableFullPipeline 
        ? '/api/renders?fullPipeline=true'
        : '/api/renders';

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setResult(data);
        options.onSuccess?.(data);
        logger.log('✅ useRenderPipeline: Render generation successful');
      } else {
        throw new Error(data.error || 'Render generation failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options.onError?.(errorMessage);
      logger.error('❌ useRenderPipeline: Render generation failed', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    generateRender,
    loading,
    error,
    result
  };
}

