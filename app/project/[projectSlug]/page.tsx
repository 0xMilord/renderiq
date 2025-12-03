'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Copy, 
  Share2,
  Image as ImageIcon,
  Loader2,
  Plus,
  GitBranch
} from 'lucide-react';
import Link from 'next/link';
import { ImageCard } from '@/components/projects/image-card';
import { ViewModeToggle } from '@/components/projects/view-mode-toggle';
import { ImageModal } from '@/components/common/image-modal';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectBySlug } from '@/lib/hooks/use-projects';
import { useRenders } from '@/lib/hooks/use-renders';
import { ChainList } from '@/components/projects/chain-list';
import type { Render } from '@/lib/db/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createRenderChain } from '@/lib/actions/projects.actions';
import { logger } from '@/lib/utils/logger';

type ViewMode = 'default' | 'compact' | 'list';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.projectSlug as string;
  
  const { project, loading: projectLoading, error: projectError } = useProjectBySlug(projectSlug);
  const { renders, chains, loading: rendersLoading, error: rendersError, fetchChains } = useRenders(project?.id || null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRender, setSelectedRender] = useState<Render | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch chains when project is loaded
  useEffect(() => {
    if (project?.id) {
      fetchChains();
    }
  }, [project?.id, fetchChains]);

  const filteredRenders = renders.filter(render => {
    const matchesSearch = render.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || render.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedRenders = [...filteredRenders].sort((a, b) => {
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

  const getGridCols = () => {
    switch (viewMode) {
      case 'compact':
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';
      case 'list':
        return 'grid-cols-1';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  const handleView = (render: Render) => {
    setSelectedRender(render);
    setIsModalOpen(true);
  };

  const handleDownload = (render: Render) => {
    if (render.outputUrl) {
      const link = document.createElement('a');
      link.href = render.outputUrl;
      link.download = `${render.prompt.substring(0, 50)}.${render.type === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleLike = (item: Render) => {
    logger.log('Like render:', item.id);
  };

  const handleShare = (item: Render) => {
    logger.log('Share render:', item.id);
  };

  const handleCreateChain = async () => {
    if (!project) return;
    
    try {
      const chainName = `Chain ${new Date().toLocaleDateString()}`;
      const result = await createRenderChain(project.id, chainName, `New render chain for ${project.name}`);
      
      if (result.success && result.data && project) {
        // Navigate to the new chain
        router.push(`/project/${project.slug}/chain/${result.data.id}`);
      } else {
        console.error('Failed to create chain:', result.error);
        alert(result.error || 'Failed to create chain');
      }
    } catch (error) {
      console.error('Error creating chain:', error);
      alert('Failed to create chain');
    }
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading project...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">Project not found</div>
            <p className="text-muted-foreground mb-4">The project you are looking for does not exist.</p>
            <Button asChild>
              <Link href="/dashboard/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/render">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              <p className="text-muted-foreground mt-2">
                {renders.length} render{renders.length !== 1 ? 's' : ''}
                {project.description && ` • ${project.description}`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Project
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Project
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs for Chains and Renders */}
        <Tabs defaultValue="chains" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="chains">Render Chains</TabsTrigger>
            <TabsTrigger value="renders">All Renders</TabsTrigger>
          </TabsList>

          <TabsContent value="chains">
            <ChainList 
              chains={chains.map(chain => ({
                ...chain,
                renderCount: renders.filter(r => r.chainId === chain.id).length,
                renders: renders.filter(r => r.chainId === chain.id).slice(0, 5)
              }))} 
              projectId={project.id}
              projectSlug={project.slug}
              onCreateChain={handleCreateChain}
            />
          </TabsContent>

          <TabsContent value="renders">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search renders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
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

            {/* Renders Grid */}
            {rendersError ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">Error loading renders</div>
                <p className="text-muted-foreground mb-4">{rendersError}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : rendersLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading renders...</p>
                </div>
              </div>
            ) : sortedRenders.length > 0 ? (
              <div className={cn("grid gap-4", getGridCols())}>
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
                      // Navigate to render page with the prompt
                      router.push(`/render?prompt=${encodeURIComponent(render.prompt)}`);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery ? 'No renders found' : 'No renders yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search or filters'
                    : 'Generate your first AI render for this project'
                  }
                </p>
                {!searchQuery && (
                  <Button asChild>
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
            setIsModalOpen(false);
            setSelectedRender(null);
          }}
          item={selectedRender}
          onLike={handleLike}
          onDownload={handleDownload}
          onShare={handleShare}
          onRemix={(prompt) => {
            router.push(`/render?prompt=${encodeURIComponent(prompt)}`);
          }}
        />
      )}
    </div>
  );
}

