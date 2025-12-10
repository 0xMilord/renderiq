'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';

type ViewMode = 'default' | 'compact' | 'list';
type SidebarView = 'tree' | 'all';
type ActiveTab = 'tool' | 'output';

interface UIPreferencesState {
  // View modes
  viewMode: ViewMode;
  sidebarView: SidebarView;
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  
  // Tool-specific
  activeTab: ActiveTab;
  
  // Filters & Search (page-specific, but persisted)
  searchQuery: string;
  sortBy: string;
  filterStatus: string;
  
  // Project/Chain page specific
  projectSearchQuery: string;
  projectSortBy: string;
  chainSearchQuery: string;
  chainSortBy: string;
  
  // Pagination
  currentPage: number;
  rendersPerPage: number;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSidebarView: (view: SidebarView) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: string) => void;
  setFilterStatus: (status: string) => void;
  setProjectSearchQuery: (query: string) => void;
  setProjectSortBy: (sortBy: string) => void;
  setChainSearchQuery: (query: string) => void;
  setChainSortBy: (sortBy: string) => void;
  setCurrentPage: (page: number) => void;
  setRendersPerPage: (perPage: number) => void;
  resetPreferences: () => void;
}

const DEFAULT_PREFERENCES: Omit<UIPreferencesState, keyof {
  setViewMode: never;
  setSidebarView: never;
  setSidebarOpen: never;
  setSidebarCollapsed: never;
  setActiveTab: never;
  setSearchQuery: never;
  setSortBy: never;
  setFilterStatus: never;
  setProjectSearchQuery: never;
  setProjectSortBy: never;
  setChainSearchQuery: never;
  setChainSortBy: never;
  setCurrentPage: never;
  setRendersPerPage: never;
  resetPreferences: never;
}> = {
  viewMode: 'default',
  sidebarView: 'all',
  isSidebarOpen: false,
  isSidebarCollapsed: false,
  activeTab: 'tool',
  searchQuery: '',
  sortBy: 'newest',
  filterStatus: 'all',
  projectSearchQuery: '',
  projectSortBy: 'newest',
  chainSearchQuery: '',
  chainSortBy: 'newest',
  currentPage: 1,
  rendersPerPage: 20,
};

export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,

      // Actions
      setViewMode: (mode) => {
        logger.log('🎨 UIPreferencesStore: Setting view mode', { mode });
        set({ viewMode: mode });
      },

      setSidebarView: (view) => {
        logger.log('🎨 UIPreferencesStore: Setting sidebar view', { view });
        set({ sidebarView: view });
      },

      setSidebarOpen: (open) => {
        logger.log('🎨 UIPreferencesStore: Setting sidebar open', { open });
        set({ isSidebarOpen: open });
      },

      setSidebarCollapsed: (collapsed) => {
        logger.log('🎨 UIPreferencesStore: Setting sidebar collapsed', { collapsed });
        set({ isSidebarCollapsed: collapsed });
      },

      setActiveTab: (tab) => {
        logger.log('🎨 UIPreferencesStore: Setting active tab', { tab });
        set({ activeTab: tab });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSortBy: (sortBy) => {
        set({ sortBy });
      },

      setFilterStatus: (status) => {
        set({ filterStatus: status });
      },

      setProjectSearchQuery: (query) => {
        set({ projectSearchQuery: query });
      },

      setProjectSortBy: (sortBy) => {
        set({ projectSortBy: sortBy });
      },

      setChainSearchQuery: (query) => {
        set({ chainSearchQuery: query });
      },

      setChainSortBy: (sortBy) => {
        set({ chainSortBy: sortBy });
      },

      setCurrentPage: (page) => {
        set({ currentPage: page });
      },

      setRendersPerPage: (perPage) => {
        set({ rendersPerPage: perPage });
      },

      resetPreferences: () => {
        logger.log('🔄 UIPreferencesStore: Resetting preferences');
        set(DEFAULT_PREFERENCES);
      },
    }),
    {
      name: 'ui-preferences-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist all preferences
        viewMode: state.viewMode,
        sidebarView: state.sidebarView,
        isSidebarOpen: state.isSidebarOpen,
        isSidebarCollapsed: state.isSidebarCollapsed,
        activeTab: state.activeTab,
        sortBy: state.sortBy,
        filterStatus: state.filterStatus,
        projectSortBy: state.projectSortBy,
        chainSortBy: state.chainSortBy,
        rendersPerPage: state.rendersPerPage,
        // Don't persist search queries and current page (ephemeral)
      }),
    }
  )
);

