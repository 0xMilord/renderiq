'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppShortcuts } from '@/lib/hooks/use-app-shortcuts';
import { captureErrorWithContext } from '@/lib/hooks/use-sentry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Grid3x3,
  ListTree,
  MoreVertical,
  Edit,
  Copy,
  Trash2
} from 'lucide-react';
import { Tree, Folder, File, type TreeViewElement } from '@/components/ui/file-tree';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditProjectModal } from '@/components/projects/edit-project-modal';
import { DuplicateProjectModal } from '@/components/projects/duplicate-project-modal';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { createRenderChain, deleteProject, deleteRenderChain } from '@/lib/actions/projects.actions';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Project, RenderChain, Render } from '@/lib/db/schema';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useProjectChainStore, type ChainWithRenders } from '@/lib/stores/project-chain-store';
import { useUIPreferencesStore } from '@/lib/stores/ui-preferences-store';
import { useModalStore } from '@/lib/stores/modal-store';
import { useSearchFilterStore } from '@/lib/stores/search-filter-store';

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

  // ✅ MIGRATED: Using Zustand stores for state management
  // Project/Chain Store
  const {
    projects,
    chains,
    selectedProjectId,
    selectedChainId,
    setProjects,
    setChains,
    setSelectedProject,
    setSelectedChain,
    addProject,
    updateProject,
    removeProject,
    addChain,
    updateChain,
    removeChain,
    clearSelection,
    syncFromUrl,
  } = useProjectChainStore();
  
  // UI Preferences Store
  const {
    viewMode,
    sidebarView,
    isSidebarOpen,
    currentPage,
    rendersPerPage,
    setViewMode,
    setSidebarView,
    setSidebarOpen,
    setCurrentPage,
  } = useUIPreferencesStore();
  
  // Search & Filter Store
  const {
    projectSearchQuery,
    projectSortBy,
    chainSearchQuery,
    chainSortBy,
    setProjectFilters,
    setChainFilters,
  } = useSearchFilterStore();
  
  // Modal Store
  const {
    isImageModalOpen,
    selectedRender,
    isProjectEditModalOpen,
    isProjectDuplicateModalOpen,
    isProjectDeleteDialogOpen,
    openImageModal,
    closeImageModal,
    openProjectEditModal,
    closeProjectEditModal,
    openProjectDuplicateModal,
    closeProjectDuplicateModal,
    openProjectDeleteDialog,
    closeProjectDeleteDialog,
  } = useModalStore();
  
  // Local state (ephemeral, not persisted)
  const [isCreatingChain, setIsCreatingChain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // Sidebar search (ephemeral)

  // ✅ FIXED: Use refs to track previous values and only update when data actually changes
  // This prevents infinite loops from reference equality checks
  const prevProjectsRef = useRef<string>('');
  const prevChainsRef = useRef<string>('');

  // ✅ SYNC: Update store when SSR props change (e.g., after router.refresh())
  // Only update if the serialized data actually changed, not just the reference
  useEffect(() => {
    const projectsKey = JSON.stringify(initialProjects.map(p => ({ id: p.id, updatedAt: p.updatedAt })));
    const chainsKey = JSON.stringify(initialChains.map(c => ({ id: c.id, updatedAt: c.updatedAt })));
    
    if (projectsKey !== prevProjectsRef.current) {
      prevProjectsRef.current = projectsKey;
      setProjects(initialProjects);
    }
    
    if (chainsKey !== prevChainsRef.current) {
      prevChainsRef.current = chainsKey;
      setChains(initialChains);
    }
  }, [initialProjects, initialChains, setProjects, setChains]);

  // ✅ AUTO-SELECT: If projectSlug is provided in query params, auto-select that project
  useEffect(() => {
    if (initialProjectSlug && projects.length > 0) {
      syncFromUrl(initialProjectSlug);
    }
  }, [initialProjectSlug, projects, syncFromUrl]);

  // ✅ OPTIMISTIC: Add project immediately when created and auto-select it
  const handleProjectCreated = (newProject: Project) => {
    addProject(newProject);
    // ✅ AUTO-SELECT: Automatically select the newly created project
    setSelectedProject(newProject.id);
    // Update URL with new project slug
    router.replace(`/render?project=${newProject.slug}`, { scroll: false });
    // ✅ AUTO-OPEN: Open sidebar on mobile when project is created (so user can see it)
    if (window.innerWidth < 640) {
      setSidebarOpen(true);
    }
  };

  // ✅ OPTIMISTIC: Add chain immediately when created
  const handleChainCreated = (newChain: ChainWithRenders) => {
    addChain(newChain);
  };

  // ✅ DELETE: Handle project deletion
  const handleProjectDelete = async (project: Project) => {
    try {
      // Store chains to restore on error
      const chainsToRestore = chains.filter(c => c.projectId === project.id);
      
      // Optimistically remove from UI
      removeProject(project.id);
      
      // Call delete action
      const result = await deleteProject(project.id);
      
      if (result.success) {
        toast.success('Project deleted successfully');
        // ✅ FIXED: Close dialog before refresh to prevent state issues
        closeProjectDeleteDialog();
        router.refresh();
      } else {
        // Revert optimistic update on error
        addProject(project);
        chainsToRestore.forEach(chain => addChain(chain));
        toast.error(result.error || 'Failed to delete project');
      }
    } catch (error) {
      // Revert optimistic update on error
      const chainsToRestore = chains.filter(c => c.projectId === project.id);
      addProject(project);
      chainsToRestore.forEach(chain => addChain(chain));
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting the project';
      toast.error(errorMessage);
      captureErrorWithContext(error, {
        component: 'ChatClient',
        feature: 'deleteProject',
        projectId: project.id,
      });
    }
  };

  // ✅ DELETE: Handle chain deletion
  const handleChainDelete = async (chain: RenderChain) => {
    try {
      // Optimistically remove from UI
      removeChain(chain.id);

      // Call delete action
      const result = await deleteRenderChain(chain.id);
      
      if (result.success) {
        toast.success('Chain deleted successfully');
        router.refresh();
      } else {
        // Revert optimistic update on error
        addChain(chain as ChainWithRenders);
        toast.error(result.error || 'Failed to delete chain');
      }
    } catch (error) {
      // Revert optimistic update on error
      addChain(chain as ChainWithRenders);
      toast.error('An error occurred while deleting the chain');
      captureErrorWithContext(error, {
        component: 'ChatClient',
        feature: 'deleteChain',
        chainId: chain.id,
        projectId: chain.projectId,
      });
    }
  };

  const handleViewAll = () => {
    clearSelection();
    router.replace('/render', { scroll: false });
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId);
    
    // Update URL with project slug
    const project = projects.find(p => p.id === projectId);
    if (project) {
      router.replace(`/render?project=${project.slug}`, { scroll: false });
    }
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
        const newChain = { ...result.data, renders: [] } as ChainWithRenders;
        removeChain(tempChain.id);
        addChain(newChain);
        
        // ✅ SYNC: Refresh SSR data to ensure consistency
        router.refresh();
        
        router.push(`/project/${project?.slug || 'project'}/chain/${result.data.id}`);
      } else {
        // ✅ ROLLBACK: Remove temp chain on error
        removeChain(tempChain.id);
        toast.error(result.error || 'Failed to create chat');
      }
    } catch (error) {
      toast.error('Failed to create chat');
      captureErrorWithContext(error, {
        component: 'ChatClient',
        feature: 'createChain',
        projectId,
      });
    } finally {
      setIsCreatingChain(null);
    }
  };

  const handleSelectChain = (chainId: string) => {
    setSelectedChain(chainId);
    // Update URL with project slug when chain is selected (handled by store)
    const chain = chains.find(c => c.id === chainId);
    if (chain) {
      const project = projects.find(p => p.id === chain.projectId);
      if (project) {
        router.replace(`/render?project=${project.slug}`, { scroll: false });
      }
    }
    // Close sidebar on mobile after selecting a chain
    if (window.innerWidth < 640) { // sm breakpoint
      setSidebarOpen(false);
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
    openImageModal(render);
  };

  const handleCloseModal = () => {
    closeImageModal();
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
  }, [selectedChainId, setCurrentPage]);


  // Build tree structure for file-tree component
  const treeElements: TreeViewElement[] = useMemo(() => {
    return filteredProjectsSidebar.map(project => {
      const projectChains = chainsByProject[project.id] || [];
      return {
        id: project.id,
        name: project.name,
        isSelectable: true,
        children: projectChains.map(chain => ({
          id: chain.id,
          name: chain.name,
          isSelectable: true,
        })),
      };
    });
  }, [filteredProjectsSidebar, chainsByProject]);

  // Get initial expanded items (selected project)
  const initialExpandedItems = useMemo(() => {
    if (selectedProjectId) {
      return [selectedProjectId];
    }
    return [];
  }, [selectedProjectId]);

  // Get initial selected item (selected chain or project)
  const initialSelectedId = useMemo(() => {
    return selectedChainId || selectedProjectId || undefined;
  }, [selectedChainId, selectedProjectId]);

  // Auto-open sidebar on desktop, keep closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) { // sm breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="flex fixed inset-0 bg-background pt-[var(--navbar-height)]">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300 shrink-0 overflow-hidden",
          isSidebarOpen 
            ? "w-full max-w-[50vw] sm:w-80" 
            : "w-12"
        )}
      >
        {isSidebarOpen ? (
          <Tabs value={sidebarView} onValueChange={(v) => setSidebarView(v as 'tree' | 'all')} className="flex-1 flex flex-col overflow-hidden w-full min-w-0 gap-0">
            {/* Sidebar Header - Tabs */}
            <div className="border-b shrink-0 flex items-end px-4 h-16 pb-3">
              <TabsList className="grid w-full grid-cols-2 min-w-0 h-10">
                <TabsTrigger value="all" className="text-xs">
                  <Grid3x3 className="h-3 w-3 mr-1.5" />
                  All
                </TabsTrigger>
                <TabsTrigger value="tree" className="text-xs">
                  <ListTree className="h-3 w-3 mr-1.5" />
                  Tree
                </TabsTrigger>
              </TabsList>
            </div>

            {/* View All Button */}
            <div className="px-4 py-4 border-b shrink-0 w-full min-w-0 overflow-hidden h-[73px]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewAll}
                className="w-full h-10 text-sm"
              >
                View All
              </Button>
            </div>

            {/* All Projects View - List Layout */}
            <TabsContent value="all" className="flex-1 overflow-hidden m-0 mt-2 min-w-0">
              {filteredProjectsSidebar.length === 0 ? (
                <div className="text-center py-8 px-4 h-full flex flex-col items-center justify-center">
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
                <ScrollArea className="h-full overflow-hidden w-full">
                  <div className="px-2 py-2 min-w-0 w-full max-w-full overflow-hidden box-border">
                    <div className="flex flex-col gap-1 min-w-0 w-full max-w-full">
                      {filteredProjectsSidebar.map((project) => {
                        const projectChains = chainsByProject[project.id] || [];
                        const projectRenders = projectChains.flatMap(c => c.renders || []);
                        const latestRender = projectRenders
                          .filter(r => r.status !== 'failed' && r.outputUrl)
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                        const isSelected = selectedProjectId === project.id;
                        const platformBadge = project.platform === 'render' || !project.platform
                          ? { label: 'Render', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
                          : project.platform === 'tools'
                          ? { label: 'Tools', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
                          : { label: 'Canvas', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };

                        return (
                          <div
                            key={project.id}
                            onClick={() => handleProjectClick(project.id)}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors min-w-0 w-full max-w-full overflow-hidden",
                              isSelected 
                                ? "bg-muted" 
                                : "hover:bg-muted/50"
                            )}
                          >
                            {/* Thumbnail */}
                            <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-muted">
                              {latestRender?.outputUrl ? (
                                <img
                                  src={latestRender.outputUrl}
                                  alt={project.name}
                                  className="w-full h-full object-cover"
                                  suppressHydrationWarning
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FolderIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            {/* Project Info */}
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5 overflow-hidden">
                              <h3 className="font-medium text-sm truncate min-w-0">
                                {project.name.charAt(0).toUpperCase() + project.name.slice(1).toLowerCase()}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate min-w-0">
                                {project.description || `${projectChains.length} chat${projectChains.length !== 1 ? 's' : ''}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Tree View */}
            <TabsContent value="tree" className="flex-1 overflow-hidden m-0 mt-2">
              {filteredProjectsSidebar.length === 0 ? (
                <div className="text-center py-8 px-4 h-full flex flex-col items-center justify-center">
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
                <Tree
                  initialSelectedId={initialSelectedId}
                  initialExpandedItems={initialExpandedItems}
                  elements={treeElements}
                  indicator={true}
                  className="h-full"
                >
                  {treeElements.map((projectElement) => {
                    const isProjectSelected = selectedProjectId === projectElement.id;
                    return (
                      <Folder
                        key={projectElement.id}
                        element={projectElement.name}
                        value={projectElement.id}
                        isSelect={isProjectSelected}
                        className={cn(
                          "px-2 py-1.5",
                          isProjectSelected && "bg-primary/20"
                        )}
                        onFolderSelect={handleProjectClick}
                      >
                        {projectElement.children?.map((chainElement) => {
                          const isChainSelected = selectedChainId === chainElement.id;
                          return (
                            <File
                              key={chainElement.id}
                              value={chainElement.id}
                              isSelect={isChainSelected}
                              fileIcon={<MessageSquare className="size-4" />}
                              className={cn(
                                "px-2 py-1.5 w-full text-left",
                                isChainSelected && "bg-primary/20"
                              )}
                              handleSelect={(id) => handleSelectChain(id)}
                            >
                              {chainElement.name}
                            </File>
                          );
                        })}
                      </Folder>
                    );
                  })}
                </Tree>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col h-full w-full">
            {/* Active Tab Indicator */}
            <div className="border-b shrink-0 flex flex-col items-center justify-center px-0 h-16 pb-3 gap-1">
              {sidebarView === 'all' ? (
                <>
                  <Grid3x3 className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary font-medium">All</span>
                </>
              ) : (
                <>
                  <ListTree className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary font-medium">Tree</span>
                </>
              )}
            </div>

            {/* Project Count Button */}
            <div className="border-b shrink-0 flex items-center justify-center px-0 h-[73px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAll}
                className="h-10 w-8 p-0 text-xs font-semibold text-primary"
                title={`${filteredProjectsSidebar.length} projects`}
              >
                {filteredProjectsSidebar.length}
              </Button>
            </div>

            {/* Thumbnails Scroll Area */}
            <ScrollArea className="flex-1 overflow-hidden w-full">
              <div className="px-2 py-2 flex flex-col gap-1 min-h-0">
                {filteredProjectsSidebar.slice(0, 20).map((project) => {
                  const projectChains = chainsByProject[project.id] || [];
                  const projectRenders = projectChains.flatMap(c => c.renders || []);
                  const latestRender = projectRenders
                    .filter(r => r.status !== 'failed' && r.outputUrl)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                  const isSelected = selectedProjectId === project.id;

                  return (
                    <div
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className={cn(
                        "flex items-center justify-center p-1 rounded-md cursor-pointer transition-colors",
                        isSelected 
                          ? "bg-muted" 
                          : "hover:bg-muted/50"
                      )}
                      title={project.name}
                    >
                      <div className="relative w-8 h-8 rounded overflow-hidden">
                        {latestRender?.outputUrl ? (
                          <img
                            src={latestRender.outputUrl}
                            alt={project.name}
                            className="w-full h-full object-cover"
                            suppressHydrationWarning
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <FolderIcon className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>


      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 w-full">
        {/* Header */}
        <div className="px-4 border-b flex items-end justify-between gap-4 h-16 pb-3">
          <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden h-10">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
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
                <h1 className="text-xl font-bold truncate">All Projects & Chats</h1>
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
                <Button variant="default" size="sm" className="h-8">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Project</span>
                  <span className="sm:hidden">Project</span>
                </Button>
              </CreateProjectModal>
            ) : selectedProjectId && !selectedChainId ? (
              <>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-8"
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
                {selectedProject && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="More options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => openProjectEditModal()}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openProjectDuplicateModal()}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openProjectDeleteDialog()}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-4 w-full min-h-0">
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
              <div className="flex gap-2 mb-0 items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={chainSearchQuery}
                    onChange={(e) => setChainFilters(e.target.value, chainSortBy)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <div className="shrink-0">
                  <Select value={chainSortBy} onValueChange={(value) => setChainFilters(chainSearchQuery, value)}>
                    <SelectTrigger size="sm" className="w-auto min-w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="shrink-0">
                  <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                </div>
              </div>

              {/* Chains Grid */}
              {sortedChains.length > 0 ? (
                <div className={cn("grid gap-4 mt-8", gridCols)}>
                  {sortedChains.map((chain) => (
                    <ChainCard
                      key={chain.id}
                      chain={chain}
                      projectSlug={selectedProject?.slug}
                      projects={projects.map(p => ({ id: p.id, slug: p.slug }))}
                      viewMode={viewMode}
                      onSelect={handleSelectChain}
                      onDelete={handleChainDelete}
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
              <div className="flex gap-2 mb-4 sm:mb-6 items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectFilters(e.target.value, projectSortBy)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <div className="shrink-0">
                  <Select value={projectSortBy} onValueChange={(value) => setProjectFilters(projectSearchQuery, value)}>
                    <SelectTrigger size="sm" className="w-auto min-w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="shrink-0">
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

                    // ✅ Extract chain snapshots from latest render's contextData
                    const chainsWithSnapshots = projectChains.map(chain => {
                      const renders = chain.renders || [];
                      if (renders.length === 0) {
                        return { id: chain.id, projectId: chain.projectId, snapshot: null };
                      }

                      // Get latest render (highest chainPosition, or most recent if no position)
                      const latestRender = renders
                        .sort((a, b) => {
                          const posA = (a as any).chainPosition ?? -1;
                          const posB = (b as any).chainPosition ?? -1;
                          if (posA !== posB) return posB - posA;
                          const dateA = new Date((a as any).createdAt).getTime();
                          const dateB = new Date((b as any).createdAt).getTime();
                          return dateB - dateA;
                        })[0];

                      const contextData = (latestRender as any).contextData;
                      const canvasState = contextData?.tldrawCanvasState;
                      const snapshot = canvasState?.canvasData;

                      return {
                        id: chain.id,
                        projectId: chain.projectId,
                        snapshot: snapshot || null,
                      };
                    });

                    return (
                      <ProjectCard
                        key={project.id}
                        project={{
                          ...project,
                          renderCount: projectRenders.length,
                          latestRenders
                        }}
                        imageAspect="video"
                        chains={chains.map(c => ({ id: c.id, projectId: c.projectId }))}
                        chainsWithSnapshots={chainsWithSnapshots}
                        viewMode={viewMode}
                        onEdit={() => router.refresh()}
                        onDuplicate={() => router.refresh()}
                        onDelete={handleProjectDelete}
                        onSelect={(p) => handleProjectClick(p.id)}
                        // On render page, clicking View should select the project to show chains
                        viewUrl={undefined} // Let onSelect handle it instead
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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

      {/* Project Action Modals - Only render when open to prevent hook calls */}
      {selectedProject && isProjectEditModalOpen && (
        <EditProjectModal
          project={selectedProject}
          open={isProjectEditModalOpen}
          onOpenChange={(open) => open ? openProjectEditModal() : closeProjectEditModal()}
          onProjectUpdated={(updatedProject) => {
            updateProject(updatedProject.id, updatedProject);
            router.refresh();
          }}
        />
      )}
      {selectedProject && isProjectDuplicateModalOpen && (
        <DuplicateProjectModal
          project={selectedProject}
          open={isProjectDuplicateModalOpen}
          onOpenChange={(open) => open ? openProjectDuplicateModal() : closeProjectDuplicateModal()}
          onProjectDuplicated={(duplicatedProject) => {
            addProject(duplicatedProject);
            router.refresh();
          }}
        />
      )}
      {selectedProject && isProjectDeleteDialogOpen && (
        <DeleteProjectDialog
          project={selectedProject}
          open={isProjectDeleteDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              openProjectDeleteDialog();
            } else {
              closeProjectDeleteDialog();
              // ✅ FIXED: Clear selection when dialog closes to prevent stale state
              setTimeout(() => {
                if (selectedProjectId === selectedProject.id) {
                  clearSelection();
                }
              }, 100);
            }
          }}
          onConfirm={async () => {
            try {
              await handleProjectDelete(selectedProject);
            } catch (error) {
              // Error is already handled in handleProjectDelete
              // Just ensure dialog stays open on error so user can retry
              console.error('Delete project error:', error);
            }
          }}
        />
      )}

    </div>
  );
}

