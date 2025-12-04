'use client';

import { UnifiedChatInterface } from '@/components/chat/unified-chat-interface';
import { useDemoData } from '@/components/demo/demo-data-context';
import type { GalleryItemWithDetails } from '@/lib/types';

interface Slide3UnifiedChatProps {
  galleryRenders?: GalleryItemWithDetails[];
  longestChains?: any[];
}

export function Slide3UnifiedChat({ galleryRenders = [], longestChains = [] }: Slide3UnifiedChatProps) {
  // Use cached data from context instead of fetching
  const { projects, chains } = useDemoData();
  
  // Try to get demo data from multiple sources:
  // 1. First try gallery renders with project/chain
  let demoRender = galleryRenders.find(r => r.render.projectId && r.render.chainId);
  let projectId = demoRender?.render.projectId || '';
  let chainId = demoRender?.render.chainId || '';
  
  // 2. If not found, try longestChains (they have projectId and chainId)
  if (!projectId || !chainId) {
    const demoChain = longestChains.find(c => c.projectId && c.id);
    if (demoChain) {
      projectId = demoChain.projectId;
      chainId = demoChain.id;
    }
  }
  
  // Get cached project and chain data (no loading, instant access)
  const project = projectId ? projects[projectId] : null;
  const chain = chainId ? chains[chainId] : null;
  
  // If still no data, use chain from longestChains directly (it has all the data we need)
  const fallbackChain = longestChains.find(c => c.id === chainId) || longestChains[0];
  
  // If no demo data available, show a message
  if (!projectId || !chainId || (!project && !fallbackChain)) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Unified Chat Interface</h2>
          <p className="text-muted-foreground">No demo data available. Please add renders to the gallery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full demo-chat-fullscreen">
      <UnifiedChatInterface
        projectId={projectId}
        chainId={chainId}
        chain={chain || fallbackChain || undefined}
        projectName={project?.name || fallbackChain?.name || 'Demo Project'}
        onBackToProjects={() => {}}
      />
    </div>
  );
}

