'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { getCreditTransactionsAction } from '@/lib/actions/billing.actions';

export function useCreditTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ OPTIMIZED: Use server action instead of API route
        const result = await getCreditTransactionsAction(50, 0);

        if (result.success && result.data) {
          setTransactions(result.data);
        } else {
          setError(result.error || 'Failed to fetch transactions');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const refreshTransactions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // ✅ OPTIMIZED: Use server action instead of API route
      const result = await getCreditTransactionsAction(50, 0);

      if (result.success && result.data) {
        setTransactions(result.data);
      } else {
        setError(result.error || 'Failed to refresh transactions');
      }
    } catch (err) {
      console.error('Failed to refresh transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh transactions');
    } finally {
      setLoading(false);
    }
  };

  return {
    transactions,
    loading,
    error,
    refreshTransactions,
  };
}
