'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { getUserSubscription, cancelSubscription as cancelSubscriptionAction } from '@/lib/actions/billing.actions';

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const result = await getUserSubscription();
        
        if (result.success) {
          setSubscription(result.subscription);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const result = await cancelSubscriptionAction(subscriptionId);
      if (result.success) {
        // Refresh subscription data
        setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      return { success: false, error: err instanceof Error ? err.message : 'Failed to cancel subscription' };
    }
  };

  const reactivateSubscription = async (subscriptionId: string) => {
    try {
      // This would call a server action to reactivate the subscription
      // For now, we'll simulate success
      setSubscription(prev => prev ? { ...prev, cancelAtPeriodEnd: false } : null);
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription');
      return { success: false, error: err instanceof Error ? err.message : 'Failed to reactivate subscription' };
    }
  };

  return {
    subscription,
    loading,
    error,
    cancelSubscription,
    reactivateSubscription,
  };
}
