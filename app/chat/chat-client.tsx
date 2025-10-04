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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRender, setSelectedRender] = useState<Render | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const rendersPerPage = 20;

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleCreateNewChain = async (projectId: string) => {
    setIsCreatingChain(projectId);
    try {
      const project = initialProjects.find(p => p.id === projectId);
      const projectChains = initialChains.filter(c => c.projectId === projectId);
      const chainName = project ? `${project.name} - Chat ${projectChains.length + 1}` : 'New Chat Chain';
      
      const result = await createRenderChain(
        projectId,
        chainName,
        'AI Chat render chain'
      );

      if (result.success && result.data) {
        router.push(`/${project?.slug || 'project'}/chat/${result.data.id}`);
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
  };

  const handleContinueEditing = () => {
    if (!selectedChainId) return;
    
    const chain = initialChains.find(c => c.id === selectedChainId);
    if (chain) {
      const project = initialProjects.find(p => p.id === chain.projectId);
      router.push(`/${project?.slug || 'project'}/chat/${selectedChainId}`);
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

  return (
    <div className="flex h-[calc(100vh-2.75rem)] bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          isSidebarOpen ? "w-full max-w-[40vw] sm:w-80" : "w-12"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn("px-4 py-3 border-b", !isSidebarOpen && "px-2")}>
          
          {/* Search and Create Project in same row */}
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 h-10">
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
                <Button variant="outline" size="sm" className="h-10 text-sm px-3">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Project
                </Button>
              </CreateProjectModal>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 h-10">
              <CreateProjectModal>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  title="New Project"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CreateProjectModal>
            </div>
          )}
        </div>

        {/* Project Tree */}
        <div className={cn("flex-1 overflow-y-auto", isSidebarOpen ? "p-2" : "p-1")}>
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
                      {/* Project Row */}
                      <div
                        className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0"
                          onClick={() => toggleProject(project.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <div
                          className="flex items-center gap-2 flex-1 min-w-0"
                          onClick={() => toggleProject(project.id)}
                        >
                          {isExpanded ? (
                            <FolderOpenIcon className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <Folder className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {project.name}
                          </span>
                          {projectChains.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {projectChains.length}
                            </span>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateNewChain(project.id);
                          }}
                          disabled={isCreatingChain === project.id}
                        >
                          {isCreatingChain === project.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      {/* Chains */}
                      {isExpanded && (
                        <div className="ml-6 space-y-0.5">
                          {projectChains.length === 0 ? (
                            <div className="px-2 py-2 text-xs text-muted-foreground">
                              No chats yet
                            </div>
                          ) : (
                            projectChains.map((chain) => (
                              <div
                                key={chain.id}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer",
                                  selectedChainId === chain.id && "bg-accent"
                                )}
                                onClick={() => handleSelectChain(chain.id)}
                              >
                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm truncate">{chain.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-2">
              {filteredProjects.slice(0, 8).map((project) => {
                const projectChains = chainsByProject[project.id] || [];
                
                return (
                  <div key={project.id} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => toggleProject(project.id)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent",
                        expandedProjects.has(project.id) && "bg-accent"
                      )}
                      title={project.name}
                    >
                      {expandedProjects.has(project.id) ? (
                        <FolderOpenIcon className="h-4 w-4 text-primary" />
                      ) : (
                        <Folder className="h-4 w-4 text-primary" />
                      )}
                    </button>
                    
                    {expandedProjects.has(project.id) && projectChains.length > 0 && (
                      <div className="flex flex-col items-center gap-1">
                        {projectChains.slice(0, 3).map((chain) => (
                          <button
                            key={chain.id}
                            onClick={() => handleSelectChain(chain.id)}
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded hover:bg-accent",
                              selectedChainId === chain.id && "bg-accent"
                            )}
                            title={chain.name}
                          >
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
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
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center gap-4 h-16">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-10 w-10"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
          {selectedChainId ? (
            <div>
              <h1 className="text-xl font-bold">
                {initialProjects.find(p => p.id === initialChains.find(c => c.id === selectedChainId)?.projectId)?.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {initialChains.find(c => c.id === selectedChainId)?.name}
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-bold">Projects & Chats</h1>
              <p className="text-sm text-muted-foreground">
                Select a chain to view renders
              </p>
            </div>
          )}
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
          ) : (
            /* Empty State */
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Chain Selected</h2>
                <p className="text-muted-foreground">
                  Select a chain from the sidebar to view its renders and continue editing.
                </p>
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

