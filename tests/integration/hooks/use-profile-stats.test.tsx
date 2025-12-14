/**
 * Integration tests for useProfileStats hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProfileStats } from '@/lib/hooks/use-profile-stats';
import { getProfileStats } from '@/lib/actions/profile.actions';

vi.mock('@/lib/actions/profile.actions', () => ({
  getProfileStats: vi.fn(),
}));

describe('useProfileStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(getProfileStats).mockResolvedValue({
      success: true,
      data: {
        totalRenders: 10,
        totalProjects: 5,
      },
    });

    const { result } = renderHook(() => useProfileStats());

    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();
  });

  it('should fetch profile stats on mount', async () => {
    const mockStats = {
      totalRenders: 10,
      totalProjects: 5,
      totalCreditsSpent: 1000,
    };

    vi.mocked(getProfileStats).mockResolvedValue({
      success: true,
      data: mockStats,
    });

    const { result } = renderHook(() => useProfileStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
  });

  it('should support refetch', async () => {
    vi.mocked(getProfileStats).mockResolvedValue({
      success: true,
      data: { totalRenders: 10 },
    });

    const { result } = renderHook(() => useProfileStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.refetch();

    expect(getProfileStats).toHaveBeenCalledTimes(2);
  });

  it('should handle errors', async () => {
    vi.mocked(getProfileStats).mockResolvedValue({
      success: false,
      error: 'Failed to fetch',
    });

    const { result } = renderHook(() => useProfileStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });
});

