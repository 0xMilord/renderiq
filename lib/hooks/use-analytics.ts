'use client';

import { useState, useEffect } from 'react';
import { getAnalyticsData, getRenderStats, getCreditStats, getApiUsageStats, type AnalyticsData, type GetAnalyticsOptions } from '@/lib/actions/analytics.actions';
import type { RenderStats, CreditStats, ApiUsageStats } from '@/lib/services/analytics-service';

export interface UseAnalyticsOptions extends GetAnalyticsOptions {
  autoFetch?: boolean;
  refetchInterval?: number; // in milliseconds
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { autoFetch = true, refetchInterval, ...fetchOptions } = options;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAnalyticsData(fetchOptions);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }

    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [autoFetch, refetchInterval, JSON.stringify(fetchOptions)]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for render statistics only
 */
export function useRenderStats(options: GetAnalyticsOptions = {}) {
  const [data, setData] = useState<RenderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getRenderStats(options);

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to fetch render stats');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch render stats');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(options)]);

  return { data, loading, error };
}

/**
 * Hook for credit statistics only
 */
export function useCreditStats(options: GetAnalyticsOptions = {}) {
  const [data, setData] = useState<CreditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getCreditStats(options);

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to fetch credit stats');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch credit stats');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(options)]);

  return { data, loading, error };
}

/**
 * Hook for API usage statistics only
 */
export function useApiUsageStats(options: GetAnalyticsOptions = {}) {
  const [data, setData] = useState<ApiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getApiUsageStats(options);

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to fetch API usage stats');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch API usage stats');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(options)]);

  return { data, loading, error };
}

