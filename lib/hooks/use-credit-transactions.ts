'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

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

        const response = await fetch('/api/credits/transactions?limit=50');
        const data = await response.json();

        if (data.success && data.data) {
          setTransactions(data.data);
        } else {
          setError(data.error || 'Failed to fetch transactions');
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
      const response = await fetch('/api/credits/transactions?limit=50');
      const data = await response.json();

      if (data.success && data.data) {
        setTransactions(data.data);
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
