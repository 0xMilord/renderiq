'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Project } from '@/lib/db/schema';
import { RenderChain } from '@/lib/types/render';
import { 
  FolderOpen, 
  MessageSquare, 
  Plus, 
  Search, 
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { createRenderChain } from '@/lib/actions/projects.actions';

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

  // Redirect to home if user logs out
  useEffect(() => {
    if (!authLoading && !user && initialized) {
      router.push('/');
    }
  }, [user, authLoading, initialized, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreatingChain, setIsCreatingChain] = useState(false);

  // Sync with SSR props
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [chains, setChains] = useState<ChainWithRenders[]>(initialChains);

  useEffect(() => {
    setProjects(initialProjects);
    setChains(initialChains);
  }, [initialProjects, initialChains]);

  // Filter projects by search
  const filteredProjects = useMemo(() => 
    projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.slug.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [projects, searchQuery]
  );

  // Get chains for selected project
  const projectChains = useMemo(() => {
    if (!selectedProjectId) return [];
    return chains.filter(chain => chain.projectId === selectedProjectId);
  }, [selectedProjectId, chains]);

  // Get selected project
  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleChainSelect = (chainId: string) => {
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      router.push(`/canvas/${project.slug}/${chainId}`);
    }
  };

  const handleCreateNewChain = async () => {
    if (!selectedProjectId) return;
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return;

    setIsCreatingChain(true);
    try {
      const projectChains = chains.filter(c => c.projectId === selectedProjectId);
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
    } finally {
      setIsCreatingChain(false);
    }
  };

  // Auto-open sidebar on desktop, keep closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) { // sm breakpoint
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-background pt-[var(--navbar-height)] overflow-hidden",
        "grid h-[calc(100vh-var(--navbar-height))]",
        isSidebarOpen ? "grid-cols-[auto_1fr]" : "grid-cols-[3rem_1fr]"
      )}
    >
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r bg-card transition-all duration-300 overflow-hidden",
          "grid grid-rows-[auto_auto_1fr] h-full",
          isSidebarOpen 
            ? "w-[50vw] sm:w-60" 
            : "w-12"
        )}
      >
        {/* Sidebar Header */}
        <div 
          className={cn(
            "border-b flex items-center shrink-0",
            isSidebarOpen ? "px-4 h-16" : "px-0 h-16 justify-center"
          )}
        >
          {isSidebarOpen ? (
            <div className="flex items-center justify-between w-full gap-4 min-h-0">
              <h2 className="text-lg font-semibold truncate flex-1 min-w-0">
                Canvas
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="h-8 w-8 shrink-0"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="h-8 w-8"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Sidebar Content */}
        {isSidebarOpen && (
          <>
            {/* Search */}
            <div className="p-4 border-b shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Projects List */}
            <ScrollArea className="overflow-y-auto min-h-0">
              <div className="p-2 space-y-1">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      selectedProjectId === project.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <span className="truncate">{project.name}</span>
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
          </>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="grid grid-rows-[auto_1fr] h-full overflow-hidden min-w-0">
        {/* Header */}
        <header className="px-4 border-b h-16 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1 overflow-hidden flex items-center gap-3">
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="h-8 w-8 shrink-0"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-lg font-semibold text-foreground truncate min-w-0">
              {selectedProject ? selectedProject.name : 'Canvas Editor'}
            </h2>
          </div>
          {selectedProjectId && (
            <Button
              onClick={handleCreateNewChain}
              disabled={isCreatingChain}
              className="shrink-0"
            >
              {isCreatingChain ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  New Canvas
                </>
              )}
            </Button>
          )}
        </header>

        {/* Content Area */}
        <section className="overflow-y-auto w-full min-h-0">
          {selectedProjectId ? (
            <div className="p-4 sm:p-6">
              {projectChains.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare className="h-12 w-12 text-muted mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No canvases yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a new canvas to start building your node workflow
                  </p>
                  <Button
                    onClick={handleCreateNewChain}
                    disabled={isCreatingChain}
                  >
                    {isCreatingChain ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Canvas
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Folder className="h-16 w-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Select a Project</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a project from the sidebar to view its canvas workflows
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
