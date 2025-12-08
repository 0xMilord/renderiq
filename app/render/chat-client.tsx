'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppShortcuts } from '@/lib/hooks/use-app-shortcuts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommonImageCard } from '@/components/common/image-card';
import { ImageModal } from '@/components/common/image-modal';
import { 
  Plus, 
  MessageSquare, 
  Loader2,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Folder,
  FolderOpen as FolderOpenIcon,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';
import { createRenderChain } from '@/lib/actions/projects.actions';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Project, RenderChain, Render } from '@/lib/db/schema';
import { useAuthStore } from '@/lib/stores/auth-store';

interface ChainWithRenders extends RenderChain {
  renders: Render[];
}

interface ChatPageClientProps {
  initialProjects: Project[];
  initialChains: ChainWithRenders[];
}

export function ChatPageClient({ initialProjects, initialChains }: ChatPageClientProps) {
  const router = useRouter();
  const { user, loading: authLoading, initialized, initialize } = useAuthStore();

  // Initialize auth store
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirect to home if user logs out
  useEffect(() => {
    if (!authLoading && !user && initialized) {
      router.push('/');
    }
  }, [user, authLoading, initialized, router]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [isCreatingChain, setIsCreatingChain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed on mobile
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRender, setSelectedRender] = useState<Render | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const rendersPerPage = 20;

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
      setSelectedProjectId(null);
    } else {
      newExpanded.add(projectId);
      setSelectedProjectId(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedChainId(null); // Clear chain selection when selecting project
  };

  const handleCreateNewChain = async (projectId: string) => {
    setIsCreatingChain(projectId);
    try {
      const project = initialProjects.find(p => p.id === projectId);
      const projectChains = initialChains.filter(c => c.projectId === projectId);
      const chainName = project ? `${project.name} - Render ${projectChains.length + 1}` : 'New Render Chain';
      
      const result = await createRenderChain(
        projectId,
        chainName,
        'Render chain'
      );

      if (result.success && result.data) {
        router.push(`/project/${project?.slug || 'project'}/chain/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to create chain');
      }
    } catch (error) {
      console.error('Failed to create chain:', error);
      toast.error('Failed to create chain');
    } finally {
      setIsCreatingChain(null);
    }
  };

  const handleSelectChain = (chainId: string) => {
    setSelectedChainId(chainId);
    const chain = initialChains.find(c => c.id === chainId);
    if (chain) {
      setSelectedProjectId(chain.projectId);
    }
    // Close sidebar on mobile after selecting a chain
    if (window.innerWidth < 640) { // sm breakpoint
      setIsSidebarOpen(false);
    }
  };

  const handleContinueEditing = () => {
    if (!selectedChainId) return;
    
    const chain = initialChains.find(c => c.id === selectedChainId);
    if (chain) {
      const project = initialProjects.find(p => p.id === chain.projectId);
      router.push(`/project/${project?.slug || 'project'}/chain/${selectedChainId}`);
    }
  };

  const handleViewRender = (render: Render) => {
    setSelectedRender(render);
    setIsImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsImageModalOpen(false);
    setSelectedRender(null);
  };

  const filteredProjects = useMemo(() => 
    initialProjects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [initialProjects, searchQuery]
  );

  // Group chains by project
  const chainsByProject = useMemo(() => 
    initialChains.reduce((acc, chain) => {
      if (!acc[chain.projectId]) {
        acc[chain.projectId] = [];
      }
      acc[chain.projectId].push(chain);
      return acc;
    }, {} as Record<string, ChainWithRenders[]>),
    [initialChains]
  );

  // Get selected project
  const selectedProject = useMemo(() => 
    selectedProjectId ? initialProjects.find(p => p.id === selectedProjectId) : null,
    [selectedProjectId, initialProjects]
  );

  // Get chains for selected project
  const selectedProjectChains = useMemo(() => 
    selectedProjectId ? (chainsByProject[selectedProjectId] || []) : [],
    [selectedProjectId, chainsByProject]
  );

  // Get renders for selected chain
  const selectedChain = useMemo(() => 
    initialChains.find(c => c.id === selectedChainId),
    [initialChains, selectedChainId]
  );

  const chainRenders = selectedChain?.renders || [];

  // Calculate pagination
  const totalPages = Math.ceil(chainRenders.length / rendersPerPage);
  const startIndex = (currentPage - 1) * rendersPerPage;
  const endIndex = startIndex + rendersPerPage;
  const paginatedRenders = chainRenders.slice(startIndex, endIndex);

  // Reset page when chain changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedChainId]);

  // Auto-expand project when selected
  useEffect(() => {
    if (selectedProjectId && !expandedProjects.has(selectedProjectId)) {
      setExpandedProjects(prev => new Set(prev).add(selectedProjectId));
    }
  }, [selectedProjectId, expandedProjects]);

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
    <div className="flex fixed inset-0 bg-background pt-[var(--navbar-height)]">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300 shrink-0",
          isSidebarOpen 
            ? "w-full max-w-[40vw] sm:w-80" 
            : "w-12"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "border-b shrink-0 flex items-end",
          isSidebarOpen ? "px-4 h-16 pb-3" : "px-0 h-16 justify-center pb-3"
        )}>
          
          {/* Search and Create Project in same row */}
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 h-10 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-10 text-sm"
                />
              </div>
              <CreateProjectModal>
                <Button variant="outline" size="sm" className="h-10 text-sm px-3 shrink-0">
                  <Plus className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Project</span>
                </Button>
              </CreateProjectModal>
            </div>
          ) : (
            <CreateProjectModal>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="New Project"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </CreateProjectModal>
          )}
        </div>

        {/* Project Tree */}
        <div className={cn(
          "flex-1 overflow-y-auto",
          isSidebarOpen ? "p-2" : "p-2 flex flex-col items-center gap-2"
        )}>
          {isSidebarOpen ? (
            filteredProjects.length === 0 ? (
              <div className="text-center py-8 px-4">
                <FolderOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'No projects found' : 'No projects yet'}
                </p>
                {!searchQuery && (
                  <CreateProjectModal>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Project
                    </Button>
                  </CreateProjectModal>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredProjects.map((project) => {
                  const projectChains = chainsByProject[project.id] || [];
                  const isExpanded = expandedProjects.has(project.id);
                  
                  return (
                    <div key={project.id} className="space-y-0.5">
                      {/* Project Row - Click to open modal */}
                      <button
                        type="button"
                        className={cn(
                          "w-full flex items-center gap-1 px-2 py-1.5 rounded-md border border-transparent hover:bg-primary/20 hover:border-primary cursor-pointer group transition-colors text-left",
                          selectedProjectId === project.id && "bg-primary/20 border-primary text-foreground"
                        )}
                        onClick={() => handleProjectClick(project.id)}
                      >
                        <Folder className={cn(
                          "h-4 w-4 flex-shrink-0 transition-colors",
                          selectedProjectId === project.id 
                            ? "text-foreground" 
                            : "text-primary group-hover:text-foreground"
                        )} />
                        <span className="text-sm font-medium truncate flex-1">
                          {project.name}
                        </span>
                        {projectChains.length > 0 && (
                          <span className={cn(
                            "text-xs",
                            selectedProjectId === project.id 
                              ? "text-accent-foreground/70" 
                              : "text-muted-foreground"
                          )}>
                            {projectChains.length}
                          </span>
                        )}
                      </button>
                      
                      {/* Show chains inline when project is selected */}
                      {selectedProjectId === project.id && projectChains.length > 0 && (
                        <div className="ml-4 space-y-0.5 mt-1">
                          {projectChains.map((chain) => (
                            <button
                              key={chain.id}
                              type="button"
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md border border-transparent hover:bg-primary/20 hover:border-primary cursor-pointer transition-colors group text-left",
                                selectedChainId === chain.id && "bg-primary/20 border-primary text-foreground"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectChain(chain.id);
                              }}
                            >
                              <MessageSquare className={cn(
                                "h-3.5 w-3.5 flex-shrink-0 transition-colors",
                                selectedChainId === chain.id 
                                  ? "text-foreground" 
                                  : "text-muted-foreground group-hover:text-foreground"
                              )} />
                              <span className="text-sm truncate">{chain.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <>
              {filteredProjects.slice(0, 8).map((project) => {
                const projectChains = chainsByProject[project.id] || [];
                
                return (
                  <div key={project.id} className="flex flex-col items-center gap-1 w-full">
                    <button
                      onClick={() => toggleProject(project.id)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:bg-primary/20 hover:border-primary transition-colors group",
                        expandedProjects.has(project.id) && "bg-primary/20 border-primary text-foreground"
                      )}
                      title={project.name}
                    >
                      {expandedProjects.has(project.id) ? (
                        <FolderOpenIcon className="h-4 w-4 text-foreground transition-colors" />
                      ) : (
                        <Folder className="h-4 w-4 text-primary group-hover:text-foreground transition-colors" />
                      )}
                    </button>
                    
                    {expandedProjects.has(project.id) && projectChains.length > 0 && (
                      <div className="flex flex-col items-center gap-1 w-full">
                        {projectChains.slice(0, 3).map((chain) => (
                          <button
                            key={chain.id}
                            onClick={() => handleSelectChain(chain.id)}
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded border border-transparent hover:bg-primary/20 hover:border-primary transition-colors group",
                              selectedChainId === chain.id && "bg-primary/20 border-primary text-foreground"
                            )}
                            title={chain.name}
                          >
                            <MessageSquare className={cn(
                              "h-3 w-3 transition-colors",
                              selectedChainId === chain.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                          </button>
                        ))}
                        {projectChains.length > 3 && (
                          <div className="text-[10px] text-muted-foreground">
                            +{projectChains.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredProjects.length > 8 && (
                <div className="text-[10px] text-muted-foreground text-center">
                  +{filteredProjects.length - 8}
                </div>
              )}
            </>
          )}
        </div>
      </div>


      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        {/* Header */}
        <div className="px-4 border-b flex items-end justify-between gap-4 h-16 pb-3">
          <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden h-10">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-10 w-10 shrink-0"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
            {selectedChainId ? (
              <div className="min-w-0 flex-1 overflow-hidden">
                <h1 className="text-xl font-bold truncate">
                  {initialProjects.find(p => p.id === initialChains.find(c => c.id === selectedChainId)?.projectId)?.name}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {initialChains.find(c => c.id === selectedChainId)?.name}
                </p>
              </div>
            ) : selectedProjectId ? (
              <div className="min-w-0 flex-1 overflow-hidden">
                <h1 className="text-xl font-bold truncate">
                  {selectedProject?.name || 'Project'}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  Select a chat to continue
                </p>
              </div>
            ) : (
              <div className="min-w-0 flex-1 overflow-hidden">
                <h1 className="text-xl font-bold truncate">Projects & Chats</h1>
                <p className="text-sm text-muted-foreground truncate">
                  Select a project to get started
                </p>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 h-10">
            {!selectedProjectId ? (
              <CreateProjectModal>
                <Button variant="default" size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Project</span>
                  <span className="sm:hidden">Project</span>
                </Button>
              </CreateProjectModal>
            ) : selectedProjectId && !selectedChainId ? (
              <Button 
                variant="default" 
                size="sm" 
                className="h-9"
                onClick={() => handleCreateNewChain(selectedProjectId)}
                disabled={isCreatingChain === selectedProjectId}
              >
                {isCreatingChain === selectedProjectId ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Start New Chat</span>
                    <span className="sm:hidden">New Chat</span>
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 w-full min-h-0">
          {selectedChainId ? (
            <div className="w-full h-full flex flex-col">
              {/* Chain Card */}
              <div className="rounded-lg border bg-card p-6 w-full max-w-4xl">
                {/* Chain Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare className="h-6 w-6 text-primary shrink-0" />
                      <h2 className="text-2xl font-bold truncate">{selectedChain?.name || 'Chat'}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {chainRenders.length} render{chainRenders.length !== 1 ? 's' : ''} in this chain
                    </p>
                  </div>
                  <Button onClick={handleContinueEditing} size="lg" className="shrink-0">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Continue Editing
                  </Button>
                </div>

                {/* Latest 4 Renders */}
                {chainRenders.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Latest Renders</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {chainRenders.slice(0, 4).map((render) => (
                        <CommonImageCard
                          key={render.id}
                          render={render}
                          variant="owner"
                          showUser={false}
                          showStats={false}
                          onView={handleViewRender}
                        />
                      ))}
                    </div>
                    {chainRenders.length > 4 && (
                      <div className="mt-6 text-center">
                        <Button
                          variant="outline"
                          onClick={handleContinueEditing}
                        >
                          View All {chainRenders.length} Renders
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No renders yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start creating renders in this chain
                    </p>
                    <Button onClick={handleContinueEditing}>
                      <Plus className="h-4 w-4 mr-2" />
                      Start Creating
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : selectedProjectId ? (
            /* Project Selected - Show Available Chats */
            <div className="w-full h-full flex flex-col">
              {/* Chats Grid */}
              {selectedProjectChains.length > 0 ? (
                <div className="flex-1 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {selectedProjectChains.map((chain) => {
                      const latestRenders = chain.renders.slice(0, 4);
                      return (
                        <div
                          key={chain.id}
                          onClick={() => handleSelectChain(chain.id)}
                          className={cn(
                            "group relative cursor-pointer rounded-lg border bg-card p-5 hover:border-primary transition-all",
                            selectedChainId === chain.id && "border-primary ring-2 ring-primary/20"
                          )}
                        >
                          {/* Chat Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="h-10 w-10 rounded-lg bg-primary/20 border border-primary flex items-center justify-center shrink-0">
                                <MessageSquare className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base truncate mb-1">
                                  {chain.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {chain.renders.length} render{chain.renders.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Render Preview Grid */}
                          {latestRenders.length > 0 ? (
                            <div className={cn(
                              "grid gap-2",
                              latestRenders.length === 1 ? "grid-cols-1" :
                              latestRenders.length === 2 ? "grid-cols-2" :
                              latestRenders.length === 3 ? "grid-cols-3" :
                              "grid-cols-2"
                            )}>
                              {latestRenders.map((render, idx) => (
                                <div
                                  key={render.id}
                                  className={cn(
                                    "relative aspect-square rounded-md overflow-hidden bg-muted border border-border group-hover:border-primary/50 transition-colors",
                                    idx === 0 && latestRenders.length === 1 && "col-span-2 row-span-2",
                                    idx === 0 && latestRenders.length === 3 && "col-span-2"
                                  )}
                                >
                                  {render.outputUrl ? (
                                    <img
                                      src={render.outputUrl}
                                      alt={`${chain.name} render ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="aspect-video rounded-md bg-muted/50 border border-dashed border-border flex items-center justify-center">
                              <div className="text-center">
                                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">No renders yet</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">No Chats Yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Create your first chat in {selectedProject?.name} to start rendering.
                  </p>
                  <Button 
                    onClick={() => handleCreateNewChain(selectedProjectId)}
                    disabled={isCreatingChain === selectedProjectId}
                    size="lg"
                  >
                    {isCreatingChain === selectedProjectId ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Start New Chat
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State - No Project Selected */
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Project Selected</h2>
                <p className="text-muted-foreground mb-6">
                  Select a project from the sidebar or create a new one to get started.
                </p>
                <CreateProjectModal>
                  <Button size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                </CreateProjectModal>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={handleCloseModal}
        item={selectedRender}
      />

    </div>
  );
}

