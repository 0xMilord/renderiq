'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { getUserCredits } from '@/lib/actions/billing.actions';
import { logger } from '@/lib/utils/logger';
import { deduplicateRequest } from '@/lib/utils/request-deduplication';

type CreditsData = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  monthlyEarned?: number;
  monthlySpent?: number;
};

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const FETCH_DEBOUNCE_MS = 2000; // 2 seconds debounce

  useEffect(() => {
    logger.log('💰 useCredits: Effect triggered, user:', !!user);
    if (!user) {
      logger.log('❌ useCredits: No user, stopping');
      setLoading(false);
      return;
    }

    // ✅ FIXED: Debounce requests to prevent excessive calls
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    if (timeSinceLastFetch < FETCH_DEBOUNCE_MS) {
      logger.log('⏸️ useCredits: Debouncing request, skipping');
      return;
    }

    const fetchCredits = async () => {
      try {
        lastFetchRef.current = Date.now();
        logger.log('🔄 useCredits: Fetching credits for user');
        setLoading(true);
        
        // ✅ FIXED: Use request deduplication to prevent duplicate calls
        const result = await deduplicateRequest(
          `credits-${user.id}`,
          () => getUserCredits(),
          true // Use cache
        );
        
        logger.log('📥 useCredits: Credits result:', result);
        if (result.success && 'credits' in result) {
          setCredits(result.credits);
          setError(null);
          logger.log('✅ useCredits: Credits set:', result.credits);
        } else {
          setError(result.error || 'Failed to fetch credits');
          logger.log('❌ useCredits: Error fetching credits:', result.error);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch credits';
        setError(errorMessage);
        console.error('❌ useCredits: Exception:', errorMessage);
      } finally {
        setLoading(false);
        logger.log('🏁 useCredits: Loading complete');
      }
    };

    fetchCredits();
  }, [user]);

  const refreshCredits = async () => {
    logger.log('🔄 useCredits: Refreshing credits');
    if (!user) {
      logger.log('❌ useCredits: No user for refresh');
      return;
    }
    
    try {
      const result = await getUserCredits();
      logger.log('📥 useCredits: Refresh result:', result);
      if (result.success && 'credits' in result) {
        setCredits(result.credits);
        setError(null);
        logger.log('✅ useCredits: Credits refreshed:', result.credits);
      } else {
        setError(result.error || 'Failed to refresh credits');
        logger.log('❌ useCredits: Refresh failed:', result.error);
      }
    } catch (err) {
      console.error('❌ useCredits: Refresh exception:', err);
    }
  };

  return {
    credits,
    loading,
    error,
    refreshCredits,
  };
}
