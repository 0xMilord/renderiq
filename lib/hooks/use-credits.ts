'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { getUserCredits } from '@/lib/actions/billing.actions';

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        setLoading(true);
        const result = await getUserCredits();
        
        if (result.success) {
          setCredits(result.credits);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch credits');
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user]);

  const refreshCredits = async () => {
    if (!user) return;
    
    try {
      const result = await getUserCredits();
      if (result.success) {
        setCredits(result.credits);
      }
    } catch (err) {
      console.error('Failed to refresh credits:', err);
    }
  };

  return {
    credits,
    loading,
    error,
    refreshCredits,
  };
}
