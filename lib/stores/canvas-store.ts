'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TLStoreSnapshot } from '@tldraw/tldraw';
import { getSnapshot } from '@tldraw/tldraw';
import { logger } from '@/lib/utils/logger';

// Type for tldraw snapshot (getSnapshot returns { document, session })
type TldrawSnapshot = ReturnType<typeof getSnapshot>;

interface CanvasStoreState {
  // Canvas snapshots by chain/render
  chainSnapshots: Record<string, TldrawSnapshot>;  // chainId → snapshot
  renderSnapshots: Record<string, TldrawSnapshot>; // renderId → snapshot
  
  // Current canvas state
  currentChainId: string | null;
  currentRenderId: string | null;
  currentSnapshot: TldrawSnapshot | null;
  
  // Actions
  setChainSnapshot: (chainId: string, snapshot: TldrawSnapshot) => void;
  setRenderSnapshot: (renderId: string, snapshot: TldrawSnapshot) => void;
  setCurrentCanvas: (chainId: string | null, renderId: string | null) => void;
  getChainSnapshot: (chainId: string) => TldrawSnapshot | null;
  getRenderSnapshot: (renderId: string) => TldrawSnapshot | null;
  clearCanvas: () => void;
  clearChainSnapshot: (chainId: string) => void;
  clearRenderSnapshot: (renderId: string) => void;
}

export const useCanvasStore = create<CanvasStoreState>()(
  persist(
    (set, get) => ({
      chainSnapshots: {},
      renderSnapshots: {},
      currentChainId: null,
      currentRenderId: null,
      currentSnapshot: null,
      
      setChainSnapshot: (chainId, snapshot) => {
        logger.log('🎨 CanvasStore: Setting chain snapshot', { chainId });
        set((state) => ({
          chainSnapshots: { ...state.chainSnapshots, [chainId]: snapshot },
          currentSnapshot: state.currentChainId === chainId ? snapshot : state.currentSnapshot,
        }));
      },
      
      setRenderSnapshot: (renderId, snapshot) => {
        logger.log('🎨 CanvasStore: Setting render snapshot', { renderId });
        set((state) => ({
          renderSnapshots: { ...state.renderSnapshots, [renderId]: snapshot },
          currentSnapshot: state.currentRenderId === renderId ? snapshot : state.currentSnapshot,
        }));
      },
      
      setCurrentCanvas: (chainId, renderId) => {
        logger.log('🎨 CanvasStore: Setting current canvas', { chainId, renderId });
        const state = get();
        const snapshot = chainId 
          ? state.chainSnapshots[chainId] 
          : renderId 
          ? state.renderSnapshots[renderId] 
          : null;
        set({
          currentChainId: chainId,
          currentRenderId: renderId,
          currentSnapshot: snapshot,
        });
      },
      
      getChainSnapshot: (chainId) => {
        return get().chainSnapshots[chainId] || null;
      },
      
      getRenderSnapshot: (renderId) => {
        return get().renderSnapshots[renderId] || null;
      },
      
      clearCanvas: () => {
        logger.log('🗑️ CanvasStore: Clearing canvas');
        set({
          currentChainId: null,
          currentRenderId: null,
          currentSnapshot: null,
        });
      },
      
      clearChainSnapshot: (chainId) => {
        logger.log('🗑️ CanvasStore: Clearing chain snapshot', { chainId });
        set((state) => {
          const { [chainId]: _, ...rest } = state.chainSnapshots;
          return {
            chainSnapshots: rest,
            currentSnapshot: state.currentChainId === chainId ? null : state.currentSnapshot,
          };
        });
      },
      
      clearRenderSnapshot: (renderId) => {
        logger.log('🗑️ CanvasStore: Clearing render snapshot', { renderId });
        set((state) => {
          const { [renderId]: _, ...rest } = state.renderSnapshots;
          return {
            renderSnapshots: rest,
            currentSnapshot: state.currentRenderId === renderId ? null : state.currentSnapshot,
          };
        });
      },
    }),
    {
      name: 'canvas-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist snapshots for offline support
        chainSnapshots: state.chainSnapshots,
        renderSnapshots: state.renderSnapshots,
        currentChainId: state.currentChainId,
        currentRenderId: state.currentRenderId,
      }),
    }
  )
);

