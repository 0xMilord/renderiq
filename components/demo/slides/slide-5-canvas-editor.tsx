'use client';

import { CanvasEditor } from '@/components/canvas/canvas-editor';
import { useRenderChain } from '@/lib/hooks/use-render-chain';
import { useProject } from '@/lib/hooks/use-projects';
import { Loader2 } from 'lucide-react';
import type { GalleryItemWithDetails } from '@/lib/types';

interface Slide5CanvasEditorProps {
  galleryRenders?: GalleryItemWithDetails[];
}

export function Slide5CanvasEditor({ galleryRenders = [] }: Slide5CanvasEditorProps) {
  // Get projectId and chainId from gallery renders
  const demoRender = galleryRenders.find(r => r.render.projectId && r.render.chainId);
  const projectId = demoRender?.render.projectId || '';
  const chainId = demoRender?.render.chainId || '';
  
  // Fetch project and chain data using hooks
  const { project, loading: projectLoading } = useProject(projectId || null);
  const { chain, loading: chainLoading } = useRenderChain(chainId || null);

  // If no demo data available, show a message
  if (!demoRender || !projectId || !chainId) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Canvas Editor</h2>
          <p className="text-muted-foreground">No demo data available. Please add renders to the gallery.</p>
        </div>
      </div>
    );
  }

  if (projectLoading || chainLoading || !project) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-8 overflow-hidden">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl text-foreground">Loading canvas editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-8 overflow-hidden">
      <div className="w-full h-full max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center relative z-10">
        <CanvasEditor
          projectId={projectId}
          chainId={chainId}
          projectSlug={project.slug}
          projectName={project.name || "Demo Project"}
          chainName={chain?.name || "Demo Chain"}
        />
      </div>
    </div>
  );
}
