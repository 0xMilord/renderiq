'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tldraw/tldraw';
import { getSnapshot, loadSnapshot } from '@tldraw/tldraw';

// Type for tldraw snapshot (getSnapshot returns { document, session })
type TldrawSnapshot = ReturnType<typeof getSnapshot>;
import { 
  saveCanvasStateAction, 
  loadCanvasStateAction,
  loadChainCanvasStateAction,
  saveChainCanvasStateAction 
} from '@/lib/actions/canvas.actions';
import type { CanvasState } from '@/lib/types/render';
import { logger } from '@/lib/utils/logger';
import { useCanvasStore } from '@/lib/stores/canvas-store';

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

  // ✅ NEW: Get canvas store for Zustand integration
  const {
    setChainSnapshot,
    setRenderSnapshot,
    setCurrentCanvas,
    getChainSnapshot,
    getRenderSnapshot,
  } = useCanvasStore();

  /**
   * Load canvas state - chain-level or render-level
   * Priority: Zustand store (instant) > Database (persistent)
   */
  const loadCanvasState = useCallback(async () => {
    if (!editor) return;
    
    // Need either chainId or currentRenderId
    if (!chainId && !currentRenderId) return;

    // ✅ Priority 1: Load from Zustand store (instant, offline support)
    let snapshot: TldrawSnapshot | null = null;
    if (chainId) {
      snapshot = getChainSnapshot(chainId);
      if (snapshot) {
        try {
          loadSnapshot(editor.store, snapshot);
          logger.log('✅ useRenderiqCanvas: Loaded from Zustand store', { 
            chainId,
            source: 'store'
          });
          setIsLoading(false);
          return; // Early return - store is source of truth
        } catch (error) {
          logger.error('❌ useRenderiqCanvas: Failed to load snapshot from store', error);
          // Fall through to database load
        }
      }
    } else if (currentRenderId) {
      snapshot = getRenderSnapshot(currentRenderId);
      if (snapshot) {
        try {
          loadSnapshot(editor.store, snapshot);
          logger.log('✅ useRenderiqCanvas: Loaded from Zustand store', { 
            currentRenderId,
            source: 'store'
          });
          setIsLoading(false);
          return; // Early return - store is source of truth
        } catch (error) {
          logger.error('❌ useRenderiqCanvas: Failed to load snapshot from store', error);
          // Fall through to database load
        }
      }
    }

    // ✅ Priority 2: Load from database (if not in store or store load failed)
    setIsLoading(true);
    try {
      let result;
      
      // Priority 1: Load from chain-level state if chainId provided
      if (chainId) {
        result = await loadChainCanvasStateAction(chainId);
        logger.log('🔄 useRenderiqCanvas: Loading from database (chain-level)', { chainId });
      } 
      // Priority 2: Fall back to render-level state
      else if (currentRenderId) {
        result = await loadCanvasStateAction(currentRenderId);
        logger.log('🔄 useRenderiqCanvas: Loading from database (render-level)', { currentRenderId });
      }

      if (result?.success) {
        // Handle both formats: { canvasData } and direct CanvasState
        const canvasState = result.data as CanvasState | { canvasData: CanvasState } | null;
        const dbSnapshot = (canvasState && 'canvasData' in canvasState 
          ? canvasState.canvasData 
          : canvasState?.canvasData) as TldrawSnapshot | undefined;
        
        if (dbSnapshot) {
          try {
            loadSnapshot(editor.store, dbSnapshot);
            
            // ✅ NEW: Save to Zustand store for next time (instant access)
            if (chainId) {
              setChainSnapshot(chainId, dbSnapshot);
            } else if (currentRenderId) {
              setRenderSnapshot(currentRenderId, dbSnapshot);
            }
            
            logger.log('✅ useRenderiqCanvas: Loaded canvas state from database', { 
              chainId, 
              currentRenderId,
              source: chainId ? 'chain-level (DB)' : 'render-level (DB)'
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
  }, [chainId, currentRenderId, editor, getChainSnapshot, getRenderSnapshot, setChainSnapshot, setRenderSnapshot]);

  /**
   * Save canvas state - to Zustand store (instant) and database (persistent)
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

      // ✅ NEW: Save to Zustand store first (instant, reactive, localStorage)
      if (chainId) {
        setChainSnapshot(chainId, snapshot);
        logger.log('✅ useRenderiqCanvas: Saved to Zustand store (chain)', { chainId });
      } else if (currentRenderId) {
        setRenderSnapshot(currentRenderId, snapshot);
        logger.log('✅ useRenderiqCanvas: Saved to Zustand store (render)', { currentRenderId });
      }

      // ✅ ALSO: Save to database (persistent, multi-device sync)
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

      // Wait for all saves to complete (non-blocking - store already updated)
      const results = await Promise.allSettled(savePromises);
      
      // Check if any save succeeded
      const hasSuccess = results.some(r => r.status === 'fulfilled' && r.value?.success);
      
      if (hasSuccess) {
        lastSavedStateRef.current = snapshotString;
        logger.log('✅ useRenderiqCanvas: Saved canvas state to database', { 
          chainId, 
          currentRenderId,
          savedTo: chainId && currentRenderId ? 'both' : chainId ? 'chain' : 'render'
        });
      } else {
        // Log failures but don't throw (non-critical - store already updated)
        results.forEach((result, idx) => {
          if (result.status === 'rejected' || !result.value?.success) {
            logger.warn('⚠️ useRenderiqCanvas: Database save failure (store already updated)', { 
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
  }, [chainId, currentRenderId, editor, setChainSnapshot, setRenderSnapshot]);

  /**
   * Auto-save on state changes
   * Works with both chainId and currentRenderId
   * Listens to document changes (not session changes) per tldraw best practices
   */
  useEffect(() => {
    if (!autoSave || !editor || (!chainId && !currentRenderId)) return;

    // ✅ UPDATED: Listen to document changes only (per tldraw docs)
    // scope: 'document' filters to document changes (shapes, pages, assets)
    // source: 'user' filters to user-initiated changes (not remote)
    const unsubscribe = editor.store.listen(
      () => {
        // Debounce auto-save
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
          saveCanvasState();
        }, autoSaveInterval);
      },
      { scope: 'document', source: 'user' } // ✅ Per tldraw docs: listen to document changes from user
    );

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

  /**
   * ✅ NEW: Update current canvas in store when chain/render changes
   * This enables cross-component access to current canvas state
   */
  useEffect(() => {
    setCurrentCanvas(chainId || null, currentRenderId || null);
  }, [chainId, currentRenderId, setCurrentCanvas]);

  return {
    editor,
    setEditor,
    isLoading,
    isSaving,
    loadCanvasState,
    saveCanvasState,
  };
}

