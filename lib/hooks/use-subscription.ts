'use client';

import { useState, useEffect } from 'react';
import { getUserSubscriptionAction, getUserCreditsWithResetAction, isUserProAction, getUserBillingStatsAction } from '@/lib/actions/billing.actions';

/**
 * Hook to get user's subscription status
 */
export function useSubscription(userId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const result = await getUserSubscriptionAction(userId);
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch subscription');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [userId]);

  return { data, loading, error };
}

/**
 * Hook to check if user is pro
 */
export function useIsPro(userId?: string) {
  const [data, setData] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkPro = async () => {
      try {
        setLoading(true);
        const result = await isUserProAction(userId);
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to check pro status');
          setData(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(false);
      } finally {
        setLoading(false);
      }
    };

    checkPro();
  }, [userId]);

  return { data, loading, error };
}

/**
 * Hook to get user credits with reset information
 */
export function useCreditsWithReset(userId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        setLoading(true);
        const result = await getUserCreditsWithResetAction(userId);
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch credits');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Refresh credits every 30 seconds
    const interval = setInterval(fetchCredits, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return { data, loading, error };
}

/**
 * ✅ BATCHED: Hook to get all user billing stats in a single call
 * Replaces separate useCreditsWithReset, useIsPro, and useSubscription hooks
 * Prevents N+1 queries by fetching everything in one optimized database query
 */
export function useUserBillingStats(userId?: string) {
  const [data, setData] = useState<{
    credits: any;
    subscription: any;
    isPro: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await getUserBillingStatsAction(userId);
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch billing stats');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return { data, loading, error };
}
