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
        // This would typically be a server action or API call
        // For now, we'll simulate some mock data
        const mockTransactions = [
          {
            id: '1',
            amount: 10,
            type: 'earned',
            description: 'Welcome bonus credits',
            referenceType: 'bonus',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          {
            id: '2',
            amount: -1,
            type: 'spent',
            description: 'Image render - Modern house design',
            referenceType: 'render',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            id: '3',
            amount: -1,
            type: 'spent',
            description: 'Image render - Office building concept',
            referenceType: 'render',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            id: '4',
            amount: 100,
            type: 'earned',
            description: 'Pro Plan monthly credits',
            referenceType: 'subscription',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            id: '5',
            amount: -5,
            type: 'spent',
            description: 'Video render - Architectural walkthrough',
            referenceType: 'render',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        ];
        
        setTransactions(mockTransactions);
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
      // This would call the actual API
      // For now, we'll just refresh the mock data
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setLoading(false);
    } catch (err) {
      console.error('Failed to refresh transactions:', err);
    }
  };

  return {
    transactions,
    loading,
    error,
    refreshTransactions,
  };
}
