/**
 * Integration tests for useAnalytics hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAnalytics } from '@/lib/hooks/use-analytics';
import { getAnalyticsData } from '@/lib/actions/analytics.actions';

vi.mock('@/lib/actions/analytics.actions', () => ({
  getAnalyticsData: vi.fn(),
}));

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    vi.mocked(getAnalyticsData).mockResolvedValue({
      success: true,
      data: {
        renderStats: {},
        creditStats: {},
        apiUsageStats: {},
        userActivityStats: {},
        dailyUsage: [],
      },
    });

    const { result } = renderHook(() => useAnalytics());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('should fetch analytics data on mount', async () => {
    const mockData = {
      renderStats: { totalRenders: 10 },
      creditStats: { totalSpent: 100 },
      apiUsageStats: { apiCalls: 50 },
      userActivityStats: { activeDays: 5 },
      dailyUsage: [],
    };

    vi.mocked(getAnalyticsData).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('should support refetch interval', async () => {
    vi.useFakeTimers();

    vi.mocked(getAnalyticsData).mockResolvedValue({
      success: true,
      data: { renderStats: {} },
    });

    renderHook(() => useAnalytics({ refetchInterval: 1000 }));

    await waitFor(() => {
      expect(getAnalyticsData).toHaveBeenCalled();
    });

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(getAnalyticsData).toHaveBeenCalledTimes(3);
    });

    vi.useRealTimers();
  });

  it('should handle errors', async () => {
    vi.mocked(getAnalyticsData).mockResolvedValue({
      success: false,
      error: 'Failed to fetch',
    });

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });
});

