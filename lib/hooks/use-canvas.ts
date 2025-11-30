'use client';

import { useState, useEffect, useCallback } from 'react';
import { CanvasState } from '@/lib/types/canvas';

export function useCanvas(chainId: string) {
  const [graph, setGraph] = useState<CanvasState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/canvas/${chainId}/graph`);
      const result = await response.json();

      if (result.success && result.data) {
        setGraph(result.data);
      } else {
        setError(result.error || 'Failed to load canvas');
        setGraph(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load canvas');
      setGraph(null);
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  const saveGraph = useCallback(
    async (canvasState: CanvasState) => {
      try {
        const response = await fetch(`/api/canvas/${chainId}/graph`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(canvasState),
        });

        const result = await response.json();
        if (result.success) {
          setGraph(canvasState);
        } else {
          console.error('Failed to save canvas:', result.error);
        }
      } catch (err) {
        console.error('Failed to save canvas:', err);
      }
    },
    [chainId]
  );

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return {
    graph,
    loading,
    error,
    saveGraph,
    refetch: fetchGraph,
  };
}

