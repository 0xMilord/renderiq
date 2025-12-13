'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tldraw/tldraw';
import type { TLStoreSnapshot } from '@tldraw/tldraw';
import { getSnapshot, loadSnapshot } from '@tldraw/tldraw';
import { 
  saveCanvasStateAction, 
  loadCanvasStateAction,
  loadChainCanvasStateAction,
  saveChainCanvasStateAction 
} from '@/lib/actions/canvas.actions';
import type { CanvasState } from '@/lib/types/render';
import { logger } from '@/lib/utils/logger';

/**
 * Hook for managing tldraw canvas state
 * Follows pattern from use-canvas.ts and use-render-pipeline.ts
 */
interface UseRenderiqCanvasOptions {
  chainId?: string;
  currentRenderId?: string;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
}

export function useRenderiqCanvas(options: UseRenderiqCanvasOptions = {}) {
  const {
    chainId,
    currentRenderId,
    autoSave = true,
    autoSaveInterval = 2000, // 2 seconds
  } = options;

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string | null>(null);

  /**
   * Load canvas state - chain-level or render-level
   * Priority: chainId > currentRenderId
   */
  const loadCanvasState = useCallback(async () => {
    if (!editor) return;
    
    // Need either chainId or currentRenderId
    if (!chainId && !currentRenderId) return;

    setIsLoading(true);
    try {
      let result;
      
      // Priority 1: Load from chain-level state if chainId provided
      if (chainId) {
        result = await loadChainCanvasStateAction(chainId);
        logger.log('🔄 useRenderiqCanvas: Attempting to load chain-level canvas state', { chainId });
      } 
      // Priority 2: Fall back to render-level state
      else if (currentRenderId) {
        result = await loadCanvasStateAction(currentRenderId);
        logger.log('🔄 useRenderiqCanvas: Attempting to load render-level canvas state', { currentRenderId });
      }

      if (result?.success) {
        // Handle both formats: { canvasData } and direct CanvasState
        const canvasState = result.data as CanvasState | { canvasData: CanvasState } | null;
        const snapshot = (canvasState && 'canvasData' in canvasState 
          ? canvasState.canvasData 
          : canvasState?.canvasData) as TLStoreSnapshot | undefined;
        
        if (snapshot) {
          try {
            loadSnapshot(editor.store, snapshot);
            logger.log('✅ useRenderiqCanvas: Loaded canvas state', { 
              chainId, 
              currentRenderId,
              source: chainId ? 'chain-level' : 'render-level'
            });
          } catch (error) {
            logger.error('❌ useRenderiqCanvas: Failed to load snapshot into store', error);
            throw error;
          }
        }
      }
    } catch (error) {
      logger.error('❌ useRenderiqCanvas: Failed to load canvas state', error);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, currentRenderId, editor]);

  /**
   * Save canvas state - to both chain-level and render-level
   * Ensures state is preserved at both levels
   */
  const saveCanvasState = useCallback(async () => {
    if (!editor) return;
    
    // Need either chainId or currentRenderId
    if (!chainId && !currentRenderId) return;

    try {
      // Serialize tldraw state using tldraw v4 API
      // getSnapshot returns { document, session } structure
      const snapshot = getSnapshot(editor.store);
      // Save both document and session - document contains shapes/pages, session contains editor state
      const snapshotString = JSON.stringify(snapshot);
      
      // Skip if state hasn't changed
      if (snapshotString === lastSavedStateRef.current) {
        return;
      }

      setIsSaving(true);

      const canvasState: CanvasState = {
        version: '1.0.0',
        canvasData: snapshot, // Contains { document, session }
      };

      // Save to both chain-level and render-level
      const savePromises: Promise<any>[] = [];
      
      // Save to chain-level if chainId provided
      if (chainId) {
        savePromises.push(saveChainCanvasStateAction(chainId, canvasState));
      }
      
      // Save to render-level if currentRenderId provided
      if (currentRenderId) {
        savePromises.push(saveCanvasStateAction(currentRenderId, canvasState));
      }

      // Wait for all saves to complete
      const results = await Promise.allSettled(savePromises);
      
      // Check if any save succeeded
      const hasSuccess = results.some(r => r.status === 'fulfilled' && r.value?.success);
      
      if (hasSuccess) {
        lastSavedStateRef.current = snapshotString;
        logger.log('✅ useRenderiqCanvas: Saved canvas state', { 
          chainId, 
          currentRenderId,
          savedTo: chainId && currentRenderId ? 'both' : chainId ? 'chain' : 'render'
        });
      } else {
        // Log failures but don't throw (non-critical)
        results.forEach((result, idx) => {
          if (result.status === 'rejected' || !result.value?.success) {
            logger.warn('⚠️ useRenderiqCanvas: Partial save failure', { 
              index: idx,
              error: result.status === 'rejected' ? result.reason : result.value?.error
            });
          }
        });
      }
    } catch (error) {
      logger.error('❌ useRenderiqCanvas: Failed to save canvas state', error);
    } finally {
      setIsSaving(false);
    }
  }, [chainId, currentRenderId, editor]);

  /**
   * Auto-save on state changes
   * Works with both chainId and currentRenderId
   */
  useEffect(() => {
    if (!autoSave || !editor || (!chainId && !currentRenderId)) return;

    // Listen to store changes for auto-save
    const unsubscribe = editor.store.listen(() => {
      // Debounce auto-save
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveCanvasState();
      }, autoSaveInterval);
    });

    return () => {
      unsubscribe();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, editor, chainId, currentRenderId, autoSaveInterval, saveCanvasState]);

  /**
   * Load state on mount or when chainId/renderId changes
   * Priority: chainId > currentRenderId
   */
  useEffect(() => {
    if (editor && (chainId || currentRenderId)) {
      loadCanvasState();
    }
  }, [editor, chainId, currentRenderId, loadCanvasState]);

  return {
    editor,
    setEditor,
    isLoading,
    isSaving,
    loadCanvasState,
    saveCanvasState,
  };
}

