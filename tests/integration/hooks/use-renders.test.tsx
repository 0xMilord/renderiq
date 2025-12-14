/**
 * Integration tests for useRenders hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRenders } from '@/lib/hooks/use-renders';
import { getRendersByProject, getProjectChains } from '@/lib/actions/projects.actions';

vi.mock('@/lib/actions/projects.actions', () => ({
  getRendersByProject: vi.fn(),
  getProjectChains: vi.fn(),
}));

describe('useRenders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useRenders(null));

    expect(result.current.renders).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch renders when projectId is provided', async () => {
    const mockRenders = [{ id: '1', prompt: 'Test' }];
    vi.mocked(getRendersByProject).mockResolvedValue({
      success: true,
      data: mockRenders as any,
    });

    const { result } = renderHook(() => useRenders('project-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.renders).toEqual(mockRenders);
  });

  it('should fetch chains for project', async () => {
    const mockChains = [{ id: 'chain-1', name: 'Chain 1' }];
    vi.mocked(getRendersByProject).mockResolvedValue({
      success: true,
      data: [],
    });
    vi.mocked(getProjectChains).mockResolvedValue({
      success: true,
      data: mockChains as any,
    });

    const { result } = renderHook(() => useRenders('project-123'));

    await waitFor(() => {
      expect(result.current.chains.length).toBeGreaterThan(0);
    });
  });

  it('should handle errors', async () => {
    vi.mocked(getRendersByProject).mockResolvedValue({
      success: false,
      error: 'Failed to fetch',
    });

    const { result } = renderHook(() => useRenders('project-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });
});

