import { useState, useEffect, useCallback } from 'react';
import { RenderChain, Render } from '@/lib/db/schema';
import { RenderChainWithRenders } from '@/lib/types/render-chain';
import { 
  getRenderChain, 
  getProjectChains, 
  addRenderToChain,
  createRenderChain 
} from '@/lib/actions/projects.actions';

export const useRenderChain = (chainId: string | null) => {
  const [chain, setChain] = useState<RenderChainWithRenders | null>(null);
  const [renders, setRenders] = useState<Render[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chain data
  const fetchChain = useCallback(async () => {
    if (!chainId) {
      setChain(null);
      setRenders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getRenderChain(chainId);
      
      if (result.success && result.data) {
        setChain(result.data);
        setRenders(result.data.renders);
      } else {
        setError(result.error || 'Failed to fetch chain');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chain');
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  // Add render to chain
  const addRender = useCallback(async (renderId: string, position?: number) => {
    if (!chainId) return;

    try {
      const result = await addRenderToChain(chainId, renderId, position);
      
      if (result.success) {
        // Refresh chain data
        await fetchChain();
      } else {
        throw new Error(result.error || 'Failed to add render to chain');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add render');
      throw err;
    }
  }, [chainId, fetchChain]);

  // Select a render version
  const selectVersion = useCallback((renderId: string) => {
    const selected = renders.find(r => r.id === renderId);
    return selected || null;
  }, [renders]);

  // Get render by position
  const getRenderByPosition = useCallback((position: number) => {
    return renders.find(r => r.chainPosition === position) || null;
  }, [renders]);

  // Get next render in chain
  const getNextRender = useCallback((currentPosition: number) => {
    return renders.find(r => (r.chainPosition || 0) === currentPosition + 1) || null;
  }, [renders]);

  // Get previous render in chain
  const getPreviousRender = useCallback((currentPosition: number) => {
    return renders.find(r => (r.chainPosition || 0) === currentPosition - 1) || null;
  }, [renders]);

  // Fetch chain on mount and when chainId changes
  useEffect(() => {
    fetchChain();
  }, [fetchChain]);

  return {
    chain,
    renders,
    loading,
    error,
    fetchChain,
    addRender,
    selectVersion,
    getRenderByPosition,
    getNextRender,
    getPreviousRender,
  };
};

export const useProjectChains = (projectId: string | null) => {
  const [chains, setChains] = useState<RenderChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all chains for project
  const fetchChains = useCallback(async () => {
    if (!projectId) {
      setChains([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getProjectChains(projectId);
      
      if (result.success && result.data) {
        setChains(result.data);
      } else {
        setError(result.error || 'Failed to fetch chains');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chains');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Create new chain
  const createChain = useCallback(async (name: string, description?: string) => {
    if (!projectId) return null;

    setError(null);

    try {
      const result = await createRenderChain(projectId, name, description);
      
      if (result.success && result.data) {
        // Refresh chains list
        await fetchChains();
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create chain');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chain');
      throw err;
    }
  }, [projectId, fetchChains]);

  // Fetch chains on mount and when projectId changes
  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  return {
    chains,
    loading,
    error,
    fetchChains,
    createChain,
  };
};

