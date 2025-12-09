'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Project } from '@/lib/db/schema';
import { RenderChain } from '@/lib/types/render';
import { FolderOpen, MessageSquare, Plus, Search, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/stores/auth-store';

interface ChainWithRenders extends RenderChain {
  renders: any[];
}

interface CanvasPageClientProps {
  initialProjects: Project[];
  initialChains: ChainWithRenders[];
}

export function CanvasPageClient({ initialProjects, initialChains }: CanvasPageClientProps) {
  const router = useRouter();
  const { user, loading: authLoading, initialized } = useAuthStore();

  // ✅ REMOVED: Duplicate initialize() call
  // AuthProvider already calls initialize(), no need to call it here
  // Components should only read from store, not initialize it

  // Redirect to home if user logs out
  useEffect(() => {
    if (!authLoading && !user && initialized) {
      router.push('/');
    }
  }, [user, authLoading, initialized, router]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter projects by search
  const filteredProjects = useMemo(() => 
    initialProjects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.slug.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [initialProjects, searchQuery]
  );

  // Get chains for selected project
  const projectChains = useMemo(() => {
    if (!selectedProjectId) return [];
    return initialChains.filter(chain => chain.projectId === selectedProjectId);
  }, [selectedProjectId, initialChains]);

  // Get selected project
  const selectedProject = useMemo(() => 
    initialProjects.find(p => p.id === selectedProjectId),
    [initialProjects, selectedProjectId]
  );

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleChainSelect = (chainId: string) => {
    const project = initialProjects.find(p => p.id === selectedProjectId);
    if (project) {
      router.push(`/canvas/${project.slug}/${chainId}`);
    }
  };

  const handleCreateNewChain = async () => {
    if (!selectedProjectId) return;
    const project = initialProjects.find(p => p.id === selectedProjectId);
    if (!project) return;

    try {
      // Import the createRenderChain function
      const { createRenderChain } = await import('@/lib/actions/projects.actions');
      const projectChains = initialChains.filter(c => c.projectId === selectedProjectId);
      const chainName = `Canvas ${projectChains.length + 1}`;
      
      const result = await createRenderChain(
        selectedProjectId,
        chainName,
        'Canvas node editor workflow'
      );

      if (result.success && result.data) {
        router.push(`/canvas/${project.slug}/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to create canvas');
      }
    } catch (error) {
      toast.error('Failed to create canvas');
      console.error('Failed to create chain:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-var(--navbar-height))] pt-[var(--navbar-height)] bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top Toolbar - Photoshop-like */}
      <div className="h-12 bg-card border-b border-border flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Canvas Editor</span>
        </div>
        <Separator orientation="vertical" className="h-6 bg-border" />
        <div className="flex-1 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground h-8 w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={`h-8 ${viewMode === 'grid' ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={`h-8 ${viewMode === 'list' ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Projects */}
        <div className="w-64 bg-card border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground mb-2">Projects</h2>
            <p className="text-xs text-muted-foreground">{filteredProjects.length} projects</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedProjectId === project.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    <span className="truncate">{project.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {project.slug}
                  </div>
                </button>
              ))}
              {filteredProjects.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No projects found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content - Chains */}
        <div className="flex-1 bg-background flex flex-col">
          {selectedProjectId ? (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{selectedProject?.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {projectChains.length} chat{projectChains.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  onClick={handleCreateNewChain}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Canvas
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {viewMode === 'grid' ? (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {projectChains.map((chain) => (
                      <Card
                        key={chain.id}
                        className="bg-card border-border cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleChainSelect(chain.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
                            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                              {chain.renders?.length || 0} renders
                            </Badge>
                          </div>
                          <CardTitle className="text-card-foreground text-base mt-2 line-clamp-1">
                            {chain.name}
                          </CardTitle>
                          {chain.description && (
                            <CardDescription className="text-muted-foreground text-xs line-clamp-2 mt-1">
                              {chain.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="text-xs text-muted-foreground">
                            {new Date(chain.updatedAt).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {projectChains.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                        <MessageSquare className="h-12 w-12 text-muted mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No chats yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create a new canvas to start building your node workflow
                        </p>
                        <Button
                          onClick={handleCreateNewChain}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Canvas
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {projectChains.map((chain) => (
                      <Card
                        key={chain.id}
                        className="bg-card border-border cursor-pointer hover:border-primary transition-colors"
                        onClick={() => handleChainSelect(chain.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-card-foreground font-medium truncate">{chain.name}</h3>
                                {chain.description && (
                                  <p className="text-sm text-muted-foreground truncate mt-1">
                                    {chain.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                                {chain.renders?.length || 0} renders
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(chain.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {projectChains.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <MessageSquare className="h-12 w-12 text-muted mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No chats yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create a new canvas to start building your node workflow
                        </p>
                        <Button
                          onClick={handleCreateNewChain}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Canvas
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FolderOpen className="h-16 w-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Select a Project</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a project from the sidebar to view its canvas chats
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

