'use client';

import { useState, useEffect } from 'react';
import { getAmbassadorDashboardAction } from '@/lib/actions/ambassador.actions';

export function useAmbassadorDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getAmbassadorDashboardAction();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

