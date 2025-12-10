'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Search, 
  Image as ImageIcon,
  Loader2,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { ImageCard } from '@/components/projects/image-card';
import { ViewModeToggle } from '@/components/projects/view-mode-toggle';
import { ImageModal } from '@/components/common/image-modal';
import { cn } from '@/lib/utils';
import { useProjects } from '@/lib/hooks/use-projects';
import { useRenders } from '@/lib/hooks/use-renders';
import { ChainList } from '@/components/projects/chain-list';
import type { Render, Project } from '@/lib/db/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createRenderChain } from '@/lib/actions/projects.actions';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';

type ViewMode = 'default' | 'compact' | 'list';

export default function ProjectSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { projects } = useProjects();
  
  // ✅ MIGRATED: Using Zustand stores for state management
  const { viewMode, setViewMode } = useUIPreferencesStore();
  const { renderSearchQuery, renderSortBy, renderFilterStatus, setRenderFilters } = useSearchFilterStore();
  const { isImageModalOpen, selectedRender, openImageModal, closeImageModal } = useModalStore();
  
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'chains' | 'renders'>('chains');
  
  // Use store values with local aliases for backward compatibility
  const searchQuery = renderSearchQuery;
  const sortBy = renderSortBy;
  const filterStatus = renderFilterStatus;
  const setSearchQuery = (query: string) => setRenderFilters(query, sortBy, filterStatus);
  const setSortBy = (newSortBy: string) => setRenderFilters(searchQuery, newSortBy, filterStatus);
  const setFilterStatus = (newStatus: string) => setRenderFilters(searchQuery, sortBy, newStatus);
  const isModalOpen = isImageModalOpen; // Alias for backward compatibility

  // Use the renders hook with proper architecture
  // The hook automatically fetches chains when projectId changes
  const { renders, chains, loading: rendersLoading, error: rendersError } = useRenders(project?.id || null);

  // ✅ REACT 19 OPTIMIZED: Use useMemo for derived state instead of useEffect
  // In React 19, useEffect should NOT be used for derived state - use useMemo instead
  const foundProject = useMemo(() => {
    if (!slug || projects.length === 0) return null;
    logger.log('🔍 [ProjectSlugPage] Finding project by slug:', slug);
    const project = projects.find(p => p.slug === slug);
    if (project) {
      logger.log('✅ [ProjectSlugPage] Project found:', project.name);
    } else {
      logger.log('❌ [ProjectSlugPage] Project not found for slug:', slug);
    }
    return project || null;
  }, [slug, projects]);

  // ✅ REACT 19 OPTIMIZED: Only use useEffect for side effects (setting state from derived value)
  useEffect(() => {
    setProject(foundProject);
  }, [foundProject]);

  // Memoize filtered renders to avoid recalculating on every render
  const filteredRenders = useMemo(() => {
    return renders.filter(render => {
      const matchesSearch = render.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || render.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [renders, searchQuery, filterStatus]);

  // Memoize sorted renders to avoid recalculating on every render
  const sortedRenders = useMemo(() => {
    return [...filteredRenders].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [filteredRenders, sortBy]);

  // Memoize grid columns calculation
  const gridCols = useMemo(() => {
    switch (viewMode) {
      case 'compact':
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';
      case 'list':
        return 'grid-cols-1';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  }, [viewMode]);

  // Optimize chain-render mapping: O(n*m) -> O(n+m) using Map
  const rendersByChainId = useMemo(() => {
    const map = new Map<string, Render[]>();
    renders.forEach(render => {
      if (render.chainId) {
        if (!map.has(render.chainId)) {
          map.set(render.chainId, []);
        }
        map.get(render.chainId)!.push(render);
      }
    });
    return map;
  }, [renders]);

  // Memoize chains with renders to avoid expensive recalculation
  const chainsWithRenders = useMemo(() => {
    return chains.map(chain => ({
      ...chain,
      renderCount: rendersByChainId.get(chain.id)?.length || 0,
      renders: rendersByChainId.get(chain.id)?.slice(0, 5) || []
    }));
  }, [chains, rendersByChainId]);

  // Memoize event handlers with useCallback
  const handleView = useCallback((render: Render) => {
    setSelectedRender(render);
    setIsModalOpen(true);
  }, []);

  const handleDownload = useCallback((render: Render) => {
    if (render.outputUrl) {
      const link = document.createElement('a');
      link.href = render.outputUrl;
      link.download = `${render.prompt.substring(0, 50)}.${render.type === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const handleLike = useCallback((item: Render) => {
    // Implement like functionality
    logger.log('Like render:', item.id);
  }, []);

  const handleShare = useCallback((item: Render) => {
    // Implement share functionality
    logger.log('Share render:', item.id);
  }, []);

  const handleCreateChain = useCallback(async () => {
    if (!project) return;
    
    try {
      const chainName = `Chain ${new Date().toLocaleDateString()}`;
      const result = await createRenderChain(project.id, chainName, `New render chain for ${project.name}`);
      
      if (result.success && result.data && project) {
        // Redirect to unified project/chain route
        router.push(`/project/${project.slug}/chain/${result.data.id}`);
      } else {
        console.error('Failed to create chain:', result.error);
        alert(result.error || 'Failed to create chain');
      }
    } catch (error) {
      console.error('Error creating chain:', error);
      alert('Failed to create chain');
    }
  }, [project, router]);

  // Show loading state while projects are loading or project is not found yet
  if (!project && projects.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground text-sm sm:text-base">Loading project...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if project not found
  if (!project) {
    return (
      <div className="h-full w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center py-8 sm:py-12">
            <div className="text-destructive mb-4 text-sm sm:text-base">Project not found</div>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">The project you are looking for does not exist.</p>
            <Button asChild size="sm" className="text-sm">
              <Link href="/dashboard/projects">
                <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                Back to Projects
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* Tabs for Chains and Renders */}
        <Tabs defaultValue="chains" value={activeTab} onValueChange={(value) => setActiveTab(value as 'chains' | 'renders')} className="w-full">
          {/* Tabs, Search, Filters - All in one row on desktop, tabs on new row on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6 sm:items-center">
            {/* Tabs and New Chain Button - Full width on mobile, inline on desktop */}
            <div className="flex items-center gap-2 w-full sm:w-auto sm:shrink-0">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:inline-flex flex-1 sm:flex-initial">
                <TabsTrigger value="chains" className="text-xs sm:text-sm">Render Chains</TabsTrigger>
                <TabsTrigger value="renders" className="text-xs sm:text-sm">All Renders</TabsTrigger>
              </TabsList>
              {activeTab === 'chains' && (
                <Button onClick={handleCreateChain} size="sm" className="shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chain
                </Button>
              )}
            </div>
            
            {/* Search, Filters, View Toggle Row - Only show for All Renders tab */}
            {activeTab === 'renders' && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search renders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="status">By status</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
              </div>
            )}
          </div>

          <TabsContent value="chains">
            <ChainList 
              chains={chainsWithRenders} 
              projectId={project.id}
              projectSlug={project.slug}
              onCreateChain={handleCreateChain}
            />
          </TabsContent>

          <TabsContent value="renders" className="mt-0">

        {/* Renders Grid */}
        {rendersError ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-destructive mb-4 text-sm sm:text-base">Error loading renders</div>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">{rendersError}</p>
            <Button onClick={() => window.location.reload()} size="sm" className="text-sm">
              Try Again
            </Button>
          </div>
        ) : rendersLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground text-sm sm:text-base">Loading renders...</p>
            </div>
          </div>
        ) : sortedRenders.length > 0 ? (
          <div className={cn("grid gap-3 sm:gap-4", gridCols)}>
            {sortedRenders.map((render) => (
              <ImageCard
                key={render.id}
                render={render}
                viewMode={viewMode}
                onView={handleView}
                onDownload={handleDownload}
                onLike={handleLike}
                onShare={handleShare}
                onRemix={(render) => {
                  // Navigate to chat with the prompt
                  router.push(`/render?prompt=${encodeURIComponent(render.prompt)}`);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              {searchQuery ? 'No renders found' : 'No renders yet'}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'Generate your first AI render for this project'
              }
            </p>
            {!searchQuery && (
              <Button asChild size="sm" className="text-sm">
                <Link href="/render">
                  Generate Render
                </Link>
              </Button>
            )}
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Modal */}
      {selectedRender && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => {
            closeImageModal();
          }}
          item={selectedRender}
          onLike={handleLike}
          onDownload={handleDownload}
          onShare={handleShare}
          onRemix={(prompt) => {
            // Navigate to render page - prompt will be handled client-side
            router.push(`/render`);
          }}
        />
      )}
    </div>
  );
}
