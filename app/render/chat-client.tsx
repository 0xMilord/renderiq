'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { ProjectChainsModal } from '@/components/projects/project-chains-modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Project, RenderChain, Render } from '@/lib/db/schema';

interface ChainWithRenders extends RenderChain {
  renders: Render[];
}

interface ChatPageClientProps {
  initialProjects: Project[];
  initialChains: ChainWithRenders[];
}

export function ChatPageClient({ initialProjects, initialChains }: ChatPageClientProps) {
  const router = useRouter();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [isCreatingChain, setIsCreatingChain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start closed on mobile
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
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
    setIsProjectModalOpen(true);
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
    <div className="flex h-[calc(100vh-2.75rem)] bg-background">
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
                      <div
                        className={cn(
                          "flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer group transition-colors",
                          selectedProjectId === project.id && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => handleProjectClick(project.id)}
                      >
                        <Folder className={cn(
                          "h-4 w-4 flex-shrink-0",
                          selectedProjectId === project.id 
                            ? "text-foreground" 
                            : "text-primary"
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
                      </div>
                      
                      {/* Show chains inline when project is selected */}
                      {selectedProjectId === project.id && projectChains.length > 0 && (
                        <div className="ml-4 space-y-0.5 mt-1">
                          {projectChains.map((chain) => (
                            <div
                              key={chain.id}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                                selectedChainId === chain.id && "bg-accent text-accent-foreground"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectChain(chain.id);
                              }}
                            >
                              <MessageSquare className={cn(
                                "h-3.5 w-3.5 flex-shrink-0",
                                selectedChainId === chain.id 
                                  ? "text-foreground" 
                                  : "text-muted-foreground"
                              )} />
                              <span className="text-sm truncate">{chain.name}</span>
                            </div>
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
                        "w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors",
                        expandedProjects.has(project.id) && "bg-accent text-accent-foreground"
                      )}
                      title={project.name}
                    >
                      {expandedProjects.has(project.id) ? (
                        <FolderOpenIcon className={cn(
                          "h-4 w-4",
                          expandedProjects.has(project.id) ? "text-foreground" : "text-primary"
                        )} />
                      ) : (
                        <Folder className="h-4 w-4 text-primary" />
                      )}
                    </button>
                    
                    {expandedProjects.has(project.id) && projectChains.length > 0 && (
                      <div className="flex flex-col items-center gap-1 w-full">
                        {projectChains.slice(0, 3).map((chain) => (
                          <button
                            key={chain.id}
                            onClick={() => handleSelectChain(chain.id)}
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded hover:bg-accent hover:text-accent-foreground transition-colors",
                              selectedChainId === chain.id && "bg-accent text-accent-foreground"
                            )}
                            title={chain.name}
                          >
                            <MessageSquare className={cn(
                              "h-3 w-3",
                              selectedChainId === chain.id ? "text-foreground" : "text-muted-foreground"
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
      <div className="flex-1 flex flex-col overflow-hidden">
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
        <div className="flex-1 overflow-y-auto p-6">
          {selectedChainId ? (
            <div className="w-full h-full flex flex-col">
              {/* Chain Actions */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Renders</h2>
                  <p className="text-sm text-muted-foreground">
                    {chainRenders.length} render{chainRenders.length !== 1 ? 's' : ''} in this chain
                  </p>
                </div>
                <Button onClick={handleContinueEditing} size="lg">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Continue Editing
                </Button>
              </div>

              {/* Renders Grid */}
              {chainRenders.length > 0 ? (
                <div className="flex-1 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
                    {paginatedRenders.map((render) => (
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
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          const showPage = 
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1);
                          
                          const showEllipsis = 
                            (page === currentPage - 2 && currentPage > 3) ||
                            (page === currentPage + 2 && currentPage < totalPages - 2);
                          
                          if (showEllipsis) {
                            return <span key={page} className="px-2 text-muted-foreground">...</span>;
                          }
                          
                          if (!showPage) return null;
                          
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-9"
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      <span className="ml-2 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
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
          ) : selectedProjectId ? (
            /* Project Selected - Show Available Chats */
            <div className="w-full h-full flex flex-col">
              {/* Chats Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Chats</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedProjectChains.length} chat{selectedProjectChains.length !== 1 ? 's' : ''} in {selectedProject?.name}
                  </p>
                </div>
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

              {/* Chats Grid */}
              {selectedProjectChains.length > 0 ? (
                <div className="flex-1 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
                    {selectedProjectChains.map((chain) => {
                      const chainProject = initialProjects.find(p => p.id === chain.projectId);
                      return (
                        <div
                          key={chain.id}
                          onClick={() => handleSelectChain(chain.id)}
                          className={cn(
                            "group relative cursor-pointer rounded-lg border bg-card p-4 hover:border-primary transition-all",
                            selectedChainId === chain.id && "border-primary ring-2 ring-primary/20"
                          )}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold text-sm truncate flex-1">
                                {chain.name}
                              </h3>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{chain.renders.length} render{chain.renders.length !== 1 ? 's' : ''}</span>
                              {chainProject && (
                                <span className="truncate ml-2">{chainProject.name}</span>
                              )}
                            </div>
                            {chain.renders.length > 0 && chain.renders[0]?.imageUrl && (
                              <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                                <img
                                  src={chain.renders[0].imageUrl}
                                  alt={chain.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
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

      {/* Project Chains Modal */}
      <ProjectChainsModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        project={selectedProject}
        chains={selectedProjectChains}
        onChainSelect={handleSelectChain}
      />
    </div>
  );
}

