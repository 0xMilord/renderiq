/**
 * Integration tests for useNodeExecution hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNodeExecution } from '@/lib/hooks/use-node-execution';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useNodeExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useNodeExecution());

    expect(result.current.loading).toBe(false);
  });

  it('should generate image', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          imageUrl: 'https://example.com/generated.jpg',
        },
      }),
    });

    const { result } = renderHook(() => useNodeExecution());

    const generateResult = await result.current.generateImage({
      prompt: 'A house',
      settings: {
        style: 'modern',
        quality: 'high',
        aspectRatio: '16:9',
      },
      nodeId: 'node-1',
      projectId: 'project-1',
    });

    expect(result.current.loading).toBe(false);
    expect(generateResult.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai/generate-image',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should generate variants', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          variants: [
            { imageUrl: 'https://example.com/variant1.jpg' },
            { imageUrl: 'https://example.com/variant2.jpg' },
          ],
        },
      }),
    });

    const { result } = renderHook(() => useNodeExecution());

    const generateResult = await result.current.generateVariants({
      sourceImageUrl: 'https://example.com/source.jpg',
      count: 2,
      settings: {
        variationStrength: 0.5,
        quality: 'high',
      },
      nodeId: 'node-1',
    });

    expect(generateResult.success).toBe(true);
  });

  it('should generate video', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          videoUrl: 'https://example.com/video.mp4',
        },
      }),
    });

    const { result } = renderHook(() => useNodeExecution());

    const generateResult = await result.current.generateVideo({
      prompt: 'A house video',
      duration: 4,
      aspectRatio: '16:9',
      nodeId: 'node-1',
      projectId: 'project-1',
    });

    expect(generateResult.success).toBe(true);
  });

  it('should handle errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Generation failed',
      }),
    });

    const { result } = renderHook(() => useNodeExecution());

    const generateResult = await result.current.generateImage({
      prompt: 'A house',
      settings: {
        style: 'modern',
        quality: 'high',
        aspectRatio: '16:9',
      },
      nodeId: 'node-1',
    });

    expect(generateResult.success).toBe(false);
    expect(generateResult.error).toBeDefined();
  });
});

