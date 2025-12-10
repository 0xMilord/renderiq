'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAmbassadorStatusAction } from '@/lib/actions/ambassador.actions';
import { useAuth } from './use-auth';

export interface AmbassadorStatus {
  id: string;
  userId: string;
  code: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'suspended';
  discountPercentage: number;
  commissionPercentage: number;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
}

// Cache to prevent unnecessary refetches
let ambassadorCache: {
  userId: string | null;
  data: AmbassadorStatus | null;
  timestamp: number;
} = {
  userId: null,
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 60000; // 1 minute cache

export function useAmbassador() {
  const { user } = useAuth();
  const [ambassador, setAmbassador] = useState<AmbassadorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAmbassadorStatus = useCallback(async () => {
    if (!user) {
      setAmbassador(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const now = Date.now();
    if (
      ambassadorCache.userId === user.id &&
      ambassadorCache.data &&
      now - ambassadorCache.timestamp < CACHE_DURATION
    ) {
      setAmbassador(ambassadorCache.data);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getAmbassadorStatusAction();

      if (result.success && result.data) {
        // ✅ FIXED: Convert string percentages to numbers for type compatibility
        const data = result.data as any;
        const ambassadorData: AmbassadorStatus = {
          ...data,
          discountPercentage: typeof data.discountPercentage === 'string' 
            ? parseFloat(data.discountPercentage) || 0 
            : data.discountPercentage,
          commissionPercentage: typeof data.commissionPercentage === 'string'
            ? parseFloat(data.commissionPercentage) || 0
            : data.commissionPercentage,
        };
        setAmbassador(ambassadorData);
        // Update cache
        ambassadorCache = {
          userId: user.id,
          data: ambassadorData,
          timestamp: now,
        };
      } else {
        setAmbassador(null);
        ambassadorCache = {
          userId: user.id,
          data: null,
          timestamp: now,
        };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ambassador status');
      setAmbassador(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ FIXED: Remove fetchAmbassadorStatus from dependency array to prevent infinite loop
  // fetchAmbassadorStatus is stable (memoized with useCallback), so we only need user
  useEffect(() => {
    fetchAmbassadorStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isAmbassador = !!ambassador;
  const isActiveAmbassador = ambassador?.status === 'active';
  const isPendingAmbassador = ambassador?.status === 'pending';

  return {
    ambassador,
    isAmbassador,
    isActiveAmbassador,
    isPendingAmbassador,
    loading,
    error,
    refetch: fetchAmbassadorStatus,
  };
}

