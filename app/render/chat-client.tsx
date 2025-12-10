'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppShortcuts } from '@/lib/hooks/use-app-shortcuts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommonImageCard } from '@/components/common/image-card';
import { ImageModal } from '@/components/common/image-modal';
import { ProjectCard } from '@/components/projects/project-card';
import { ChainCard } from '@/components/projects/chain-card';
import { ViewModeToggle } from '@/components/projects/view-mode-toggle';
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
  initialProjectSlug?: string;
}

export function ChatPageClient({ initialProjects, initialChains, initialProjectSlug }: ChatPageClientProps) {
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

  // ✅ OPTIMISTIC UPDATES: Stateful projects and chains that sync with SSR props
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [chains, setChains] = useState<ChainWithRenders[]>(initialChains);
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
  const [viewMode, setViewMode] = useState<'default' | 'compact' | 'list'>('default');
  const [chainSearchQuery, setChainSearchQuery] = useState('');
  const [chainSortBy, setChainSortBy] = useState('newest');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectSortBy, setProjectSortBy] = useState('newest');

  // ✅ SYNC: Update local state when SSR props change (e.g., after router.refresh())
  useEffect(() => {
    setProjects(initialProjects);
    setChains(initialChains);
  }, [initialProjects, initialChains]);

  // ✅ AUTO-SELECT: If projectSlug is provided in query params, auto-select that project
  useEffect(() => {
    if (initialProjectSlug && projects.length > 0) {
      const project = projects.find(p => p.slug === initialProjectSlug);
      if (project) {
        setSelectedProjectId(project.id);
        setExpandedProjects(prev => new Set(prev).add(project.id));
        // Clear chain selection when selecting a project
        setSelectedChainId(null);
      }
    }
  }, [initialProjectSlug, projects]);

  // ✅ OPTIMISTIC: Add project immediately when created and auto-select it
  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    // ✅ AUTO-SELECT: Automatically select the newly created project
    setSelectedProjectId(newProject.id);
    setSelectedChainId(null); // Clear any chain selection
    // Expand the project in sidebar
    setExpandedProjects(prev => new Set(prev).add(newProject.id));
    // ✅ AUTO-OPEN: Open sidebar on mobile when project is created (so user can see it)
    if (window.innerWidth < 640) {
      setIsSidebarOpen(true);
    }
  };

  // ✅ OPTIMISTIC: Add chain immediately when created
  const handleChainCreated = (newChain: ChainWithRenders) => {
    setChains(prev => [newChain, ...prev]);
  };

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
      const project = projects.find(p => p.id === projectId);
      const projectChains = chains.filter(c => c.projectId === projectId);
      const chainName = project ? `${project.name} - Render ${projectChains.length + 1}` : 'New Chat';
      
      // ✅ OPTIMISTIC: Create temporary chain immediately
      const tempChain: ChainWithRenders = {
        id: `temp-${Date.now()}`,
        projectId,
        name: chainName,
        description: 'Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
        renders: [],
      };
      handleChainCreated(tempChain);

      const result = await createRenderChain(
        projectId,
        chainName,
        'Chat'
      );

      if (result.success && result.data) {
        // ✅ OPTIMISTIC: Replace temp chain with real chain
        setChains(prev => prev.map(c => 
          c.id === tempChain.id 
            ? { ...result.data!, renders: [] } as ChainWithRenders
            : c
        ));
        
        // ✅ SYNC: Refresh SSR data to ensure consistency
        router.refresh();
        
        router.push(`/project/${project?.slug || 'project'}/chain/${result.data.id}`);
      } else {
        // ✅ ROLLBACK: Remove temp chain on error
        setChains(prev => prev.filter(c => c.id !== tempChain.id));
        toast.error(result.error || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      toast.error('Failed to create chat');
    } finally {
      setIsCreatingChain(null);
    }
  };

  const handleSelectChain = (chainId: string) => {
    setSelectedChainId(chainId);
    const chain = chains.find(c => c.id === chainId);
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
    
    const chain = chains.find(c => c.id === selectedChainId);
    if (chain) {
      const project = projects.find(p => p.id === chain.projectId);
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

  // Filter projects for sidebar (uses sidebar search)
  const filteredProjectsSidebar = useMemo(() => 
    projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [projects, searchQuery]
  );

  // Filter projects for main content (uses main content search)
  const filteredProjectsMain = useMemo(() => 
    projects.filter(project =>
      project.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(projectSearchQuery.toLowerCase())
    ),
    [projects, projectSearchQuery]
  );

  // Group chains by project
  const chainsByProject = useMemo(() => 
    chains.reduce((acc, chain) => {
      if (!acc[chain.projectId]) {
        acc[chain.projectId] = [];
      }
      acc[chain.projectId].push(chain);
      return acc;
    }, {} as Record<string, ChainWithRenders[]>),
    [chains]
  );

  // Get chains for selected project and filter them
  const filteredChains = useMemo(() => {
    if (!selectedProjectId) return [];
    const selectedChains = chainsByProject[selectedProjectId] || [];
    return selectedChains.filter(chain =>
      chain.name.toLowerCase().includes(chainSearchQuery.toLowerCase()) ||
      chain.description?.toLowerCase().includes(chainSearchQuery.toLowerCase())
    );
  }, [chainsByProject, selectedProjectId, chainSearchQuery]);

  // Get chains for selected project (for other uses)
  const selectedProjectChains = useMemo(() => 
    selectedProjectId ? (chainsByProject[selectedProjectId] || []) : [],
    [selectedProjectId, chainsByProject]
  );

  const sortedChains = useMemo(() => {
    return [...filteredChains].sort((a, b) => {
      switch (chainSortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [filteredChains, chainSortBy]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjectsMain].sort((a, b) => {
      switch (projectSortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [filteredProjectsMain, projectSortBy]);

  // Memoize grid columns calculation
  const gridCols = useMemo(() => {
    switch (viewMode) {
      case 'compact':
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
      case 'list':
        return 'grid-cols-1';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  }, [viewMode]);

  // Get selected project
  const selectedProject = useMemo(() => 
    selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null,
    [selectedProjectId, projects]
  );

  // Get renders for selected chain
  const selectedChain = useMemo(() => 
    chains.find(c => c.id === selectedChainId),
    [chains, selectedChainId]
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
              <CreateProjectModal onProjectCreated={(project) => {
                // ✅ OPTIMISTIC: Add project immediately to sidebar
                handleProjectCreated(project);
                // ✅ SYNC: Refresh SSR data in background to ensure consistency
                router.refresh();
              }}>
                <Button variant="outline" size="sm" className="h-10 text-sm px-3 shrink-0">
                  <Plus className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Project</span>
                </Button>
              </CreateProjectModal>
            </div>
          ) : (
            <CreateProjectModal onProjectCreated={(project) => {
              handleProjectCreated(project);
              router.refresh();
            }}>
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
            filteredProjectsSidebar.length === 0 ? (
              <div className="text-center py-8 px-4">
                <FolderOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'No projects found' : 'No projects yet'}
                </p>
                {!searchQuery && (
                  <CreateProjectModal 
                    platform="render"
                    onProjectCreated={(project) => {
              handleProjectCreated(project);
              router.refresh();
            }}>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Project
                    </Button>
                  </CreateProjectModal>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredProjectsSidebar.map((project) => {
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
              {filteredProjectsSidebar.slice(0, 8).map((project) => {
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
              {filteredProjectsSidebar.length > 8 && (
                <div className="text-[10px] text-muted-foreground text-center">
                  +{filteredProjectsSidebar.length - 8}
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
                  {projects.find(p => p.id === chains.find(c => c.id === selectedChainId)?.projectId)?.name}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {chains.find(c => c.id === selectedChainId)?.name}
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
              <CreateProjectModal onProjectCreated={(project) => {
              handleProjectCreated(project);
              router.refresh();
            }}>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full min-h-0">
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
                      {chainRenders.length} render{chainRenders.length !== 1 ? 's' : ''} in this chat
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
                      Start creating renders in this chat
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
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search chats..."
                    value={chainSearchQuery}
                    onChange={(e) => setChainSearchQuery(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={chainSortBy} onValueChange={setChainSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
              </div>

              {/* Chains Grid */}
              {sortedChains.length > 0 ? (
                <div className={cn("grid gap-4", gridCols)}>
                  {sortedChains.map((chain) => (
                    <ChainCard
                      key={chain.id}
                      chain={chain}
                      projectSlug={selectedProject?.slug}
                      viewMode={viewMode}
                      onSelect={handleSelectChain}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {chainSearchQuery ? 'No chats found' : 'No chats yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {chainSearchQuery 
                      ? 'Try adjusting your search or filters'
                      : 'Create your first chat in this project'
                    }
                  </p>
                  {!chainSearchQuery && (
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
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Show All Projects */
            <div className="w-full h-full flex flex-col">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={projectSortBy} onValueChange={setProjectSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
              </div>

              {/* Projects Grid */}
              {sortedProjects.length > 0 ? (
                <div className={cn("grid gap-4", gridCols)}>
                  {sortedProjects.map((project) => {
                    const projectChains = chainsByProject[project.id] || [];
                    const projectRenders = projectChains.flatMap(c => c.renders || []);
                    const latestRenders = projectRenders
                      .filter(r => r.status !== 'failed' && r.outputUrl)
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 4)
                      .map(r => ({
                        id: r.id,
                        outputUrl: r.outputUrl,
                        status: r.status,
                        type: r.type as 'image' | 'video',
                        createdAt: r.createdAt
                      }));

                    return (
                      <ProjectCard
                        key={project.id}
                        project={{
                          ...project,
                          renderCount: projectRenders.length,
                          latestRenders
                        }}
                        viewMode={viewMode}
                        onEdit={() => {}}
                        onDuplicate={() => {}}
                        onDelete={() => {}}
                        onSelect={(p) => handleProjectClick(p.id)}
                        // On render page, clicking View should select the project to show chains
                        viewUrl={undefined} // Let onSelect handle it instead
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {projectSearchQuery ? 'No projects found' : 'No projects yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {projectSearchQuery 
                      ? 'Try adjusting your search or filters'
                      : 'Create your first AI-generated project'
                    }
                  </p>
                  {!projectSearchQuery && (
                    <CreateProjectModal onProjectCreated={(project) => {
                      handleProjectCreated(project);
                      router.refresh();
                    }}>
                      <Button>Get Started</Button>
                    </CreateProjectModal>
                  )}
                </div>
              )}
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

