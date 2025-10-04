'use client';

import { useState, useEffect } from 'react';
import { getProfileStats } from '@/lib/actions/profile.actions';
import type { ProfileStats } from '@/lib/services/profile-stats';

export function useProfileStats() {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProfileStats();
      
      if (result.success) {
        setStats(result.data || null);
      } else {
        setError(result.error || 'Failed to fetch profile stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
