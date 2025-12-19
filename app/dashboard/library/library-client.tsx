'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Image as ImageIcon, 
  Video, 
  Calendar,
  Eye,
  Download,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RendersByProject } from '@/lib/actions/library.actions';
import type { Render } from '@/lib/types/render';
import { useProjectChainStore } from '@/lib/stores/project-chain-store';
import { toast } from 'sonner';

interface LibraryClientProps {
  rendersByProject: RendersByProject[];
}

export function LibraryClient({ rendersByProject }: LibraryClientProps) {
  const router = useRouter();
  // ✅ MIGRATED: Using Zustand store for project selection
  const { selectedProjectId, setSelectedProject } = useProjectChainStore();
  
  // Memoize project IDs set creation
  const projectIds = useMemo(() => 
    new Set(rendersByProject.map(item => item.project.id)),
    [rendersByProject]
  );
  
  // ✅ REACT 19 OPTIMIZED: Use useMemo for derived state instead of useEffect + useState
  // In React 19, useEffect should NOT be used for syncing derived state - use useMemo instead
  const expandedProjects = useMemo(() => projectIds, [projectIds]);
  
  // Keep state for manual toggles, but initialize from memoized value
  const [manuallyExpanded, setManuallyExpanded] = useState<Set<string>>(new Set());
  
  // Combine memoized initial state with manual toggles
  const effectiveExpandedProjects = useMemo(() => {
    const combined = new Set(expandedProjects);
    manuallyExpanded.forEach(id => combined.add(id));
    return combined;
  }, [expandedProjects, manuallyExpanded]);

  // Memoize toggleProject with useCallback
  const toggleProject = useCallback((projectId: string) => {
    setManuallyExpanded(prev => {
      const newExpanded = new Set(prev);
      // Check if it's in the effective set (either from projectIds or manually expanded)
      const isCurrentlyExpanded = effectiveExpandedProjects.has(projectId);
      if (isCurrentlyExpanded) {
        // If it's from projectIds, we can't remove it, but we can track that user wants it collapsed
        // For simplicity, just toggle the manual state
        newExpanded.delete(projectId);
      } else {
        newExpanded.add(projectId);
      }
      return newExpanded;
    });
  }, [effectiveExpandedProjects]);

  // Memoize filtered projects to avoid recalculating on every render
  const filteredProjects = useMemo(() => {
    return selectedProjectId
      ? rendersByProject.filter(item => item.project.id === selectedProjectId)
      : rendersByProject;
  }, [rendersByProject, selectedProjectId]);

  // Memoize total renders calculation
  const totalRenders = useMemo(() => 
    rendersByProject.reduce((sum, item) => sum + item.renders.length, 0),
    [rendersByProject]
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Memoize handleDownload with useCallback
  const handleDownload = useCallback(async (render: Render) => {
    if (!render.outputUrl) {
      toast.error('No download URL available');
      return;
    }
    
    const outputUrl = render.outputUrl;
    const fileName = `render-${render.id}.${render.type === 'video' ? 'mp4' : 'png'}`;
    
    // Check if URL is same-origin (download attribute works)
    let isSameOrigin = false;
    try {
      const url = new URL(outputUrl, window.location.href);
      isSameOrigin = url.origin === window.location.origin;
    } catch (urlError) {
      // Invalid URL format, treat as cross-origin and try fetch
      console.warn('Invalid URL format, attempting fetch:', urlError);
    }
    
    if (isSameOrigin) {
      // Same-origin: Use direct download link (fastest)
      const link = document.createElement('a');
      link.href = outputUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Cross-origin: Try fetch first, fallback to opening in new tab
      try {
        const response = await fetch(outputUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (fetchError) {
        // CORS error or other fetch failure: Open in new tab
        console.warn('Download fetch failed (likely CORS), opening in new tab:', fetchError);
        window.open(outputUrl, '_blank');
        toast.info('Opened in new tab. Right-click and "Save As" to download.');
      }
    }

    // ✅ Trigger export task (non-blocking)
    try {
      await fetch('/api/tasks/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderId: render.id }),
      });
    } catch (error) {
      // Silently fail - export tracking shouldn't break downloads
    }
  }, []);

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Projects List */}
      {rendersByProject.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No renders yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating renders to see them here organized by project.
            </p>
            <Button asChild>
              <Link href="/render">
                Create Your First Render
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredProjects.map(({ project, renders }) => {
            const isExpanded = effectiveExpandedProjects.has(project.id);
            
            return (
              <Card key={project.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Project Header */}
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <h2 className="font-semibold text-lg truncate">{project.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {renders.length} {renders.length === 1 ? 'render' : 'renders'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/projects/${project.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-primary hover:underline"
                      >
                        View Project
                      </Link>
                      <div className={cn(
                        "transition-transform duration-200",
                        isExpanded && "rotate-90"
                      )}>
                        →
                      </div>
                    </div>
                  </button>

                  {/* Renders Grid */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                        {renders.map((render) => {
                          const isVideo = render.type === 'video';
                          const chainPath = render.chainId 
                            ? `/project/${project.slug}/chain/${render.chainId}`
                            : `/dashboard/projects/${project.slug}`;
                          
                          return (
                            <Card key={render.id} className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                              <CardContent className="p-0">
                                {/* Render Image/Video */}
                                {/* ✅ FIXED: Removed nested Link - use onClick for navigation instead */}
                                <div 
                                  className="relative aspect-square bg-muted overflow-hidden cursor-pointer"
                                  onClick={() => router.push(chainPath)}
                                >
                                  {render.outputUrl ? (
                                    isVideo ? (
                                      // ✅ FIXED: Video element with proper attributes
                                      <video
                                        src={render.outputUrl}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        muted
                                        playsInline
                                        preload="metadata"
                                        loop
                                        onMouseEnter={(e) => e.currentTarget.play()}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.pause();
                                          e.currentTarget.currentTime = 0;
                                        }}
                                      />
                                    ) : (
                                      // Use regular img tag for external storage URLs to avoid Next.js 16 private IP blocking
                                      (render.outputUrl?.includes('supabase.co') || render.outputUrl?.includes('storage.googleapis.com') || render.outputUrl?.includes(process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || '')) ? (
                                        <img
                                          src={render.outputUrl}
                                          alt={render.prompt || 'Render'}
                                          className="absolute inset-0 w-full h-full object-cover"
                                        />
                                      ) : (
                                        <Image
                                          src={render.outputUrl}
                                          alt={render.prompt || 'Render'}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        />
                                      )
                                    )
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      {isVideo ? (
                                        <Video className="h-12 w-12 text-muted-foreground" />
                                      ) : (
                                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Status Badge */}
                                  {render.status !== 'completed' && (
                                    <div className="absolute top-2 right-2 z-10">
                                      <Badge 
                                        variant={render.status === 'failed' ? 'destructive' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {render.status}
                                      </Badge>
                                    </div>
                                  )}

                                  {/* Type Indicator */}
                                  <div className="absolute top-2 left-2 z-10">
                                    <Badge variant="secondary" className="text-xs">
                                      {isVideo ? <Video className="h-3 w-3 mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                                      {isVideo ? 'Video' : 'Image'}
                                    </Badge>
                                  </div>

                                  {/* Hover Overlay */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDownload(render);
                                        }}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          router.push(chainPath);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Render Info */}
                                <div className="p-3 space-y-2">
                                  <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                                    {render.prompt || 'Untitled render'}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(render.createdAt)}
                                    </div>
                                  </div>
                                  {render.chainPosition !== null && (
                                    <div className="text-xs text-muted-foreground">
                                      Version {render.chainPosition + 1}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

