'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { GalleryItemWithDetails } from '@/lib/types';
import type { RenderChainWithRenders } from '@/lib/types/render-chain';
import type { Project } from '@/lib/db/schema';

interface DemoDataContextValue {
  galleryRenders: GalleryItemWithDetails[];
  longestChains: RenderChainWithRenders[];
  projects: Record<string, Project>;
  chains: Record<string, RenderChainWithRenders>;
}

const DemoDataContext = createContext<DemoDataContextValue | undefined>(undefined);

export function DemoDataProvider({
  children,
  galleryRenders = [],
  longestChains = [],
  projects = {},
  chains = {},
}: {
  children: ReactNode;
  galleryRenders?: GalleryItemWithDetails[];
  longestChains?: RenderChainWithRenders[];
  projects?: Record<string, Project>;
  chains?: Record<string, RenderChainWithRenders>;
}) {
  return (
    <DemoDataContext.Provider value={{ galleryRenders, longestChains, projects, chains }}>
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData must be used within DemoDataProvider');
  }
  return context;
}

