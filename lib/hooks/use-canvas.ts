'use client';

import { useState, useEffect, useCallback } from 'react';
import { CanvasState } from '@/lib/types/canvas';
import { getCanvasGraphAction, saveCanvasGraphAction } from '@/lib/actions/canvas-files.actions';

/**
 * Hook for managing canvas graph state (file-based only)
 */
export function useCanvas(fileId: string) {
  const [graph, setGraph] = useState<CanvasState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    if (!fileId) {
      setError('fileId is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await getCanvasGraphAction(fileId);
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
  }, [fileId]);

  const saveGraph = useCallback(
    async (canvasState: CanvasState) => {
      if (!fileId) {
        console.error('fileId is required to save canvas');
        return;
      }

      try {
        const result = await saveCanvasGraphAction(fileId, canvasState);
        if (result.success) {
          setGraph(canvasState);
        } else {
          console.error('Failed to save canvas:', result.error);
        }
      } catch (err) {
        console.error('Failed to save canvas:', err);
      }
    },
    [fileId]
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

