/**
 * Integration tests for useUpscaling hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUpscaling } from '@/lib/hooks/use-upscaling';
import { createRenderAction } from '@/lib/actions/render.actions';

vi.mock('@/lib/actions/render.actions', () => ({
  createRenderAction: vi.fn(),
}));

describe('useUpscaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useUpscaling());

    expect(result.current.isUpscaling).toBe(false);
    expect(result.current.upscalingResult).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should upscale image', async () => {
    vi.mocked(createRenderAction).mockResolvedValue({
      success: true,
      data: {
        outputUrl: 'https://example.com/upscaled.jpg',
        processingTime: 1000,
        provider: 'google-generative-ai',
        id: 'render-123',
      },
    } as any);

    // Mock fetch for image conversion
    global.fetch = vi.fn().mockResolvedValue({
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      headers: {
        get: vi.fn().mockReturnValue('image/jpeg'),
      },
    } as any);

    const { result } = renderHook(() => useUpscaling());

    await result.current.upscaleImage({
      imageUrl: 'https://example.com/image.jpg',
      scale: 2,
      quality: 'high',
      projectId: 'project-123',
    });

    await waitFor(() => {
      expect(result.current.isUpscaling).toBe(false);
    });

    expect(result.current.upscalingResult).toBeDefined();
    expect(result.current.upscalingResult?.scale).toBe(2);
  });

  it('should handle upscaling errors', async () => {
    vi.mocked(createRenderAction).mockResolvedValue({
      success: false,
      error: 'Upscaling failed',
    });

    global.fetch = vi.fn().mockResolvedValue({
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      headers: {
        get: vi.fn().mockReturnValue('image/jpeg'),
      },
    } as any);

    const { result } = renderHook(() => useUpscaling());

    await result.current.upscaleImage({
      imageUrl: 'https://example.com/image.jpg',
      scale: 2,
      quality: 'high',
      projectId: 'project-123',
    });

    await waitFor(() => {
      expect(result.current.isUpscaling).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should support different scales', async () => {
    vi.mocked(createRenderAction).mockResolvedValue({
      success: true,
      data: {
        outputUrl: 'https://example.com/upscaled.jpg',
        processingTime: 1000,
      },
    } as any);

    global.fetch = vi.fn().mockResolvedValue({
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
      headers: {
        get: vi.fn().mockReturnValue('image/jpeg'),
      },
    } as any);

    const { result } = renderHook(() => useUpscaling());

    await result.current.upscaleImage({
      imageUrl: 'https://example.com/image.jpg',
      scale: 4,
      quality: 'ultra',
      projectId: 'project-123',
    });

    await waitFor(() => {
      expect(result.current.upscalingResult).toBeDefined();
    });

    expect(result.current.upscalingResult?.scale).toBe(4);
  });
});

