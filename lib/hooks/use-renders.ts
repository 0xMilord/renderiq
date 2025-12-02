'use client';

import { useState, useEffect, useCallback } from 'react';
import { getRendersByProject, getProjectChains } from '@/lib/actions/projects.actions';
import type { Render, RenderChain } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';

export function useRenders(projectId: string | null) {
  const [renders, setRenders] = useState<Render[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chain support
  const [chains, setChains] = useState<RenderChain[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);

  const fetchRenders = useCallback(async () => {
    if (!projectId) {
      setRenders([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      logger.log('🎨 [useRenders] Fetching renders for project:', projectId);
      
      const result = await getRendersByProject(projectId);
      logger.log('📊 [useRenders] getRendersByProject result:', result);
      
      if (result.success) {
        setRenders(result.data || []);
        logger.log('✅ [useRenders] Renders fetched successfully:', result.data?.length || 0);
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

  // Fetch chains for project
  const fetchChains = useCallback(async () => {
    if (!projectId) {
      setChains([]);
      return;
    }

    try {
      logger.log('🔗 [useRenders] Fetching chains for project:', projectId);
      const result = await getProjectChains(projectId);
      
      if (result.success && result.data) {
        setChains(result.data);
        logger.log('✅ [useRenders] Chains fetched:', result.data.length);
      }
    } catch (err) {
      console.error('❌ [useRenders] Failed to fetch chains:', err);
    }
  }, [projectId]);

  // Fetch renders for selected chain
  const fetchChainRenders = useCallback(async (chainId: string) => {
    if (!chainId) return;

    try {
      setLoading(true);
      setError(null);
      logger.log('🔗 [useRenders] Fetching renders for chain:', chainId);
      
      // Filter renders by chainId
      const allRenders = renders.filter(r => r.chainId === chainId);
      setRenders(allRenders);
      
      logger.log('✅ [useRenders] Chain renders filtered:', allRenders.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('❌ [useRenders] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [renders]);

  useEffect(() => {
    fetchRenders();
    fetchChains();
  }, [fetchRenders, fetchChains]);

  return {
    renders,
    loading,
    error,
    refetch: fetchRenders,
    // Chain support
    chains,
    selectedChainId,
    setSelectedChainId,
    fetchChains,
    fetchChainRenders,
  };
}
