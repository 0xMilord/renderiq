'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getProjectRules, getActiveProjectRules } from '@/lib/actions/project-rules.actions';
import type { ProjectRule } from '@/lib/db/schema';
import { deduplicateRequest } from '@/lib/utils/request-deduplication';

export function useProjectRules(chainId: string | undefined) {
  const [rules, setRules] = useState<ProjectRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const lastFetchRef = useRef<number>(0);
  const FETCH_DEBOUNCE_MS = 2000; // 2 seconds debounce

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!chainId) {
      setLoading(false);
      setRules([]);
      return;
    }

    // ✅ FIXED: Debounce requests to prevent excessive calls
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    if (timeSinceLastFetch < FETCH_DEBOUNCE_MS) {
      return;
    }

    const fetchRules = async () => {
      try {
        lastFetchRef.current = Date.now();
        setLoading(true);
        setError(null);
        
        // ✅ FIXED: Use request deduplication to prevent duplicate calls
        const result = await deduplicateRequest(
          `projectRules-${chainId}`,
          () => getProjectRules(chainId),
          true // Use cache
        );
        
        if (result.success && result.data) {
          setRules(result.data);
        } else {
          setError(result.error || 'Failed to fetch project rules');
          setRules([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setRules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [chainId, refreshTrigger]);

  return { rules, loading, error, setRules, refresh };
}

export function useActiveProjectRules(chainId: string | undefined) {
  const [rules, setRules] = useState<ProjectRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chainId) {
      setLoading(false);
      return;
    }

    const fetchRules = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getActiveProjectRules(chainId);
        if (result.success && result.data) {
          setRules(result.data);
        } else {
          setError(result.error || 'Failed to fetch active project rules');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [chainId]);

  return { rules, loading, error };
}

