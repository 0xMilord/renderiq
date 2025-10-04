'use client';

import { useState, useEffect } from 'react';
import { getUserRenders } from '@/lib/actions/user-renders.actions';
import type { Render } from '@/lib/types/render';

export function useUserRenders(projectId?: string, limit = 50) {
  const [renders, setRenders] = useState<Render[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRenders = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getUserRenders(projectId, limit);
      
      if (result.success) {
        setRenders(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch renders');
      }

    } catch (err) {
      console.error('Failed to fetch user renders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch renders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRenders();
  }, [projectId, limit]);

  const refresh = () => {
    fetchUserRenders();
  };

  return {
    renders,
    loading,
    error,
    refresh
  };
}
