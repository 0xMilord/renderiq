/**
 * Integration tests for useVideoPipeline hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVideoPipeline } from '@/lib/hooks/use-video-pipeline';

// Mock fetch
global.fetch = vi.fn();

describe('useVideoPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useVideoPipeline());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.generateVideo).toBe('function');
  });

  it('should handle video generation', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { videoId: 'video-123' } }),
    } as Response);

    const { result } = renderHook(() => useVideoPipeline());

    await result.current.generateVideo({
      prompt: 'Test video',
      quality: 'high',
      aspectRatio: '16:9',
      projectId: 'project-123',
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.result).toBeDefined();
  });
});

