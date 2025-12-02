'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { getUserCredits } from '@/lib/actions/billing.actions';
import { logger } from '@/lib/utils/logger';

type CreditsData = {
  balance: number;
  totalEarned: number;
  totalSpent: number;
};

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logger.log('💰 useCredits: Effect triggered, user:', !!user);
    if (!user) {
      logger.log('❌ useCredits: No user, stopping');
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        logger.log('🔄 useCredits: Fetching credits for user');
        setLoading(true);
        const result = await getUserCredits();
        
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
