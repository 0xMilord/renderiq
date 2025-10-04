'use client';

import { useState, useEffect } from 'react';
import { getUserActivity } from '@/lib/actions/profile.actions';
import type { ActivityItem } from '@/lib/services/user-activity';

export function useUserActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUserActivity();
      
      if (result.success) {
        setActivities(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch user activity');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
}
