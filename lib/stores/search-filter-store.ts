'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';
import type { ToolCategory } from '@/lib/tools/registry';

interface SearchFilterState {
  // Global search
  globalSearchQuery: string;
  
  // Project/Chain filters
  projectSearchQuery: string;
  projectSortBy: string;
  chainSearchQuery: string;
  chainSortBy: string;
  
  // Tool filters
  toolSearchQuery: string;
  toolCategory: ToolCategory | 'all';
  
  // Render filters
  renderSearchQuery: string;
  renderSortBy: string;
  renderFilterStatus: string;
  
  // Actions
  setGlobalSearch: (query: string) => void;
  setProjectFilters: (search: string, sortBy: string) => void;
  setChainFilters: (search: string, sortBy: string) => void;
  setToolFilters: (search: string, category: ToolCategory | 'all') => void;
  setRenderFilters: (search: string, sortBy: string, filterStatus: string) => void;
  clearAllFilters: () => void;
  clearProjectFilters: () => void;
  clearChainFilters: () => void;
  clearToolFilters: () => void;
  clearRenderFilters: () => void;
}

const DEFAULT_FILTERS: Omit<SearchFilterState, keyof {
  setGlobalSearch: never;
  setProjectFilters: never;
  setChainFilters: never;
  setToolFilters: never;
  setRenderFilters: never;
  clearAllFilters: never;
  clearProjectFilters: never;
  clearChainFilters: never;
  clearToolFilters: never;
  clearRenderFilters: never;
}> = {
  globalSearchQuery: '',
  projectSearchQuery: '',
  projectSortBy: 'newest',
  chainSearchQuery: '',
  chainSortBy: 'newest',
  toolSearchQuery: '',
  toolCategory: 'all',
  renderSearchQuery: '',
  renderSortBy: 'newest',
  renderFilterStatus: 'all',
};

export const useSearchFilterStore = create<SearchFilterState>()(
  persist(
    (set) => ({
      ...DEFAULT_FILTERS,

      // Actions
      setGlobalSearch: (query) => {
        set({ globalSearchQuery: query });
      },

      setProjectFilters: (search, sortBy) => {
        logger.log('🔍 SearchFilterStore: Setting project filters', { search, sortBy });
        set({ 
          projectSearchQuery: search,
          projectSortBy: sortBy
        });
      },

      setChainFilters: (search, sortBy) => {
        logger.log('🔍 SearchFilterStore: Setting chain filters', { search, sortBy });
        set({ 
          chainSearchQuery: search,
          chainSortBy: sortBy
        });
      },

      setToolFilters: (search, category) => {
        logger.log('🔍 SearchFilterStore: Setting tool filters', { search, category });
        set({ 
          toolSearchQuery: search,
          toolCategory: category
        });
      },

      setRenderFilters: (search, sortBy, filterStatus) => {
        logger.log('🔍 SearchFilterStore: Setting render filters', { search, sortBy, filterStatus });
        set({ 
          renderSearchQuery: search,
          renderSortBy: sortBy,
          renderFilterStatus: filterStatus
        });
      },

      clearAllFilters: () => {
        logger.log('🗑️ SearchFilterStore: Clearing all filters');
        set(DEFAULT_FILTERS);
      },

      clearProjectFilters: () => {
        set({ 
          projectSearchQuery: '',
          projectSortBy: 'newest'
        });
      },

      clearChainFilters: () => {
        set({ 
          chainSearchQuery: '',
          chainSortBy: 'newest'
        });
      },

      clearToolFilters: () => {
        set({ 
          toolSearchQuery: '',
          toolCategory: 'all'
        });
      },

      clearRenderFilters: () => {
        set({ 
          renderSearchQuery: '',
          renderSortBy: 'newest',
          renderFilterStatus: 'all'
        });
      },
    }),
    {
      name: 'search-filter-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist sort preferences, but not search queries (ephemeral)
        projectSortBy: state.projectSortBy,
        chainSortBy: state.chainSortBy,
        toolCategory: state.toolCategory,
        renderSortBy: state.renderSortBy,
        renderFilterStatus: state.renderFilterStatus,
      }),
    }
  )
);

