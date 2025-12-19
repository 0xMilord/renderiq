'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';
import type { Project, RenderChain, Render } from '@/lib/db/schema';

export interface ChainWithRenders extends RenderChain {
  renders: Render[];
}

interface ProjectChainState {
  // Selection state
  selectedProjectId: string | null;
  selectedChainId: string | null;
  
  // Data state
  projects: Project[];
  chains: ChainWithRenders[];
  
  // Actions
  setSelectedProject: (projectId: string | null) => void;
  setSelectedChain: (chainId: string | null) => void;
  setProjects: (projects: Project[]) => void;
  setChains: (chains: ChainWithRenders[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  addChain: (chain: ChainWithRenders) => void;
  updateChain: (chainId: string, updates: Partial<ChainWithRenders>) => void;
  removeChain: (chainId: string) => void;
  clearSelection: () => void;
  syncFromUrl: (projectSlug?: string, chainId?: string) => void;
}

export const useProjectChainStore = create<ProjectChainState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedProjectId: null,
      selectedChainId: null,
      projects: [],
      chains: [],

      // Actions
      setSelectedProject: (projectId) => {
        logger.log('🎯 ProjectChainStore: Setting selected project', { projectId });
        set({ 
          selectedProjectId: projectId,
          // Clear chain selection when project changes
          selectedChainId: projectId ? get().selectedChainId : null
        });
      },

      setSelectedChain: (chainId) => {
        logger.log('🎯 ProjectChainStore: Setting selected chain', { chainId });
        const state = get();
        // If chain is selected, also set its project
        if (chainId) {
          const chain = state.chains.find(c => c.id === chainId);
          if (chain) {
            set({ 
              selectedChainId: chainId,
              selectedProjectId: chain.projectId
            });
            return;
          }
        }
        set({ selectedChainId: chainId });
      },

      setProjects: (projects) => {
        logger.log('📁 ProjectChainStore: Setting projects', { count: projects.length });
        set({ projects });
      },

      setChains: (chains) => {
        logger.log('🔗 ProjectChainStore: Setting chains', { count: chains.length });
        set({ chains });
      },

      addProject: (project) => {
        logger.log('➕ ProjectChainStore: Adding project', { projectId: project.id });
        set((state) => ({
          projects: [project, ...state.projects]
        }));
      },

      updateProject: (projectId, updates) => {
        logger.log('🔄 ProjectChainStore: Updating project', { projectId });
        set((state) => ({
          projects: state.projects.map(p => 
            p.id === projectId ? { ...p, ...updates } : p
          )
        }));
      },

      removeProject: (projectId) => {
        logger.log('➖ ProjectChainStore: Removing project', { projectId });
        set((state) => {
          const newProjects = state.projects.filter(p => p.id !== projectId);
          // Clear selection if removed project was selected
          const newSelectedProjectId = state.selectedProjectId === projectId 
            ? null 
            : state.selectedProjectId;
          return {
            projects: newProjects,
            selectedProjectId: newSelectedProjectId,
            selectedChainId: newSelectedProjectId === null ? null : state.selectedChainId
          };
        });
      },

      addChain: (chain) => {
        logger.log('➕ ProjectChainStore: Adding chain', { chainId: chain.id });
        set((state) => ({
          chains: [chain, ...state.chains]
        }));
      },

      updateChain: (chainId, updates) => {
        logger.log('🔄 ProjectChainStore: Updating chain', { chainId });
        set((state) => ({
          chains: state.chains.map(c => 
            c.id === chainId ? { ...c, ...updates } : c
          )
        }));
      },

      removeChain: (chainId) => {
        logger.log('➖ ProjectChainStore: Removing chain', { chainId });
        set((state) => {
          const newChains = state.chains.filter(c => c.id !== chainId);
          // Clear selection if removed chain was selected
          const newSelectedChainId = state.selectedChainId === chainId 
            ? null 
            : state.selectedChainId;
          return {
            chains: newChains,
            selectedChainId: newSelectedChainId
          };
        });
      },

      clearSelection: () => {
        logger.log('🗑️ ProjectChainStore: Clearing selection');
        set({ 
          selectedProjectId: null,
          selectedChainId: null
        });
      },

      syncFromUrl: (projectSlug, chainId) => {
        const state = get();
        logger.log('🔄 ProjectChainStore: Syncing from URL', { projectSlug, chainId });
        
        // Find project by slug
        if (projectSlug) {
          const project = state.projects.find(p => p.slug === projectSlug);
          if (project && project.id !== state.selectedProjectId) {
            set({ selectedProjectId: project.id });
          }
        }
        
        // Set chain if provided
        if (chainId && chainId !== state.selectedChainId) {
          set({ selectedChainId: chainId });
        }
      },
    }),
    {
      name: 'project-chain-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist selection, not data (data comes from server)
        selectedProjectId: state.selectedProjectId,
        selectedChainId: state.selectedChainId,
      }),
    }
  )
);





