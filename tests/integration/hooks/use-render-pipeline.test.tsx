/**
 * Integration tests for useRenderPipeline hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRenderPipeline } from '@/lib/hooks/use-render-pipeline';

// Mock fetch
global.fetch = vi.fn();

describe('useRenderPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRenderPipeline());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
    expect(typeof result.current.generateRender).toBe('function');
  });

  it('should set loading state during generation', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { renderId: '123' } }),
    } as Response);

    const { result } = renderHook(() => useRenderPipeline());

    const request = {
      prompt: 'Test prompt',
      quality: 'standard' as const,
      aspectRatio: '16:9',
      projectId: 'project-123',
    };

    const promise = result.current.generateRender(request);

    // Loading should be true during generation
    expect(result.current.loading).toBe(true);

    await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle successful render generation', async () => {
    const mockResponse = {
      success: true,
      data: {
        renderId: 'render-123',
        outputUrl: 'https://example.com/image.jpg',
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useRenderPipeline({ onSuccess }));

    await result.current.generateRender({
      prompt: 'Test prompt',
      quality: 'standard',
      aspectRatio: '16:9',
      projectId: 'project-123',
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeDefined();
      expect(onSuccess).toHaveBeenCalledWith(mockResponse);
    });
  });

  it('should handle render generation errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid request' }),
    } as Response);

    const onError = vi.fn();
    const { result } = renderHook(() => useRenderPipeline({ onError }));

    await result.current.generateRender({
      prompt: 'Test prompt',
      quality: 'standard',
      aspectRatio: '16:9',
      projectId: 'project-123',
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should include reference image in request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    } as Response);

    const { result } = renderHook(() => useRenderPipeline());

    await result.current.generateRender({
      prompt: 'Test prompt',
      quality: 'standard',
      aspectRatio: '16:9',
      projectId: 'project-123',
      referenceImageData: 'base64data',
      referenceImageType: 'image/png',
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      const call = vi.mocked(fetch).mock.calls[0];
      expect(call).toBeDefined();
    });
  });

  it('should use full pipeline URL when enabled', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    } as Response);

    const { result } = renderHook(() => useRenderPipeline({ enableFullPipeline: true }));

    await result.current.generateRender({
      prompt: 'Test prompt',
      quality: 'high',
      aspectRatio: '16:9',
      projectId: 'project-123',
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      const call = vi.mocked(fetch).mock.calls[0];
      const url = call[0] as string;
      expect(url).toContain('fullPipeline=true');
    });
  });
});

