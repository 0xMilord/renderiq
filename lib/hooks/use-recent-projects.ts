'use client';

import { useState, useEffect } from 'react';
import { getUserRecentProjects } from '@/lib/actions/profile.actions';

export function useRecentProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUserRecentProjects();
      
      if (result.success) {
        setProjects(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch recent projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}
