'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRendersByProject } from '@/lib/actions/projects.actions';
import type { Render } from '@/lib/db/schema';

export function useRenders(projectId: string | null) {
  const [renders, setRenders] = useState<Render[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRenders = useCallback(async () => {
    if (!projectId) {
      setRenders([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🎨 [useRenders] Fetching renders for project:', projectId);
      
      const result = await getRendersByProject(projectId);
      console.log('📊 [useRenders] getRendersByProject result:', result);
      
      if (result.success) {
        setRenders(result.data || []);
        console.log('✅ [useRenders] Renders fetched successfully:', result.data?.length || 0);
      } else {
        setError(result.error || 'Failed to fetch renders');
        console.error('❌ [useRenders] Failed to fetch renders:', result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('❌ [useRenders] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRenders();
  }, [fetchRenders]);

  return {
    renders,
    loading,
    error,
    refetch: fetchRenders,
  };
}
