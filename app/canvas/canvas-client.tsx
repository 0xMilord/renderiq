'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Project } from '@/lib/db/schema';
import type { CanvasFile } from '@/lib/db/schema';
import { 
  FolderOpen, 
  FileText, 
  Plus, 
  Search, 
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Folder,
  Edit,
  Copy,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth-store';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { EditProjectModal } from '@/components/projects/edit-project-modal';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { DuplicateProjectModal } from '@/components/projects/duplicate-project-modal';
import { useProjects } from '@/lib/hooks/use-projects';
import { useCanvasFiles, useCanvasFileOperations } from '@/lib/hooks/use-canvas-files';
import { CreateCanvasFileModal } from '@/components/canvas/create-canvas-file-modal';
import { trackProjectCreated } from '@/lib/utils/sentry-metrics';
import { EditCanvasFileModal } from '@/components/canvas/edit-canvas-file-modal';
import { DeleteCanvasFileDialog } from '@/components/canvas/delete-canvas-file-dialog';
import { DuplicateCanvasFileModal } from '@/components/canvas/duplicate-canvas-file-modal';

interface CanvasPageClientProps {
  initialProjects: Project[];
}

export function CanvasPageClient({ initialProjects }: CanvasPageClientProps) {
  const router = useRouter();
  const { user, loading: authLoading, initialized } = useAuthStore();
  const { projects, removeProject, duplicateProject: duplicateProjectAction, updateProject: updateProjectAction, refetch: refetchProjects } = useProjects('canvas');
  const { files: canvasFiles, refetch: refetchCanvasFiles } = useCanvasFiles({ projectId: undefined });
  const { createFile, updateFile, deleteFile, duplicateFile, loading: fileOperationsLoading } = useCanvasFileOperations();

  // Redirect to home if user logs out
  useEffect(() => {
    if (!authLoading && !user && initialized) {
      router.push('/');
    }
  }, [user, authLoading, initialized, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  
  // Modal states
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);
  const [duplicateProjectModalOpen, setDuplicateProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [editFileModalOpen, setEditFileModalOpen] = useState(false);
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = useState(false);
  const [duplicateFileModalOpen, setDuplicateFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<CanvasFile | null>(null);

  // Sync with SSR props - filter to ensure only canvas platform projects
  const [localProjects, setLocalProjects] = useState<Project[]>(
    initialProjects.filter(p => p.platform === 'canvas')
  );

  useEffect(() => {
    // Only update with canvas platform projects from SSR
    const canvasProjects = initialProjects.filter(p => p.platform === 'canvas');
    setLocalProjects(canvasProjects);
  }, [initialProjects]);

  // Fetch canvas files for selected project - optimized to fetch immediately
  const { files: projectFiles, loading: filesLoading, refetch: refetchProjectFiles } = useCanvasFiles({ 
    projectId: selectedProjectId || undefined 
  });

  // Prefetch files when project is selected to reduce loading time
  useEffect(() => {
    if (selectedProjectId) {
      // Trigger immediate fetch
      refetchProjectFiles();
    }
  }, [selectedProjectId, refetchProjectFiles]);

  // Sync projects from hook (merge with local state to preserve newly created projects)
  // This ensures projects created in canvas don't disappear before server revalidation
  // ✅ FILTER: Only include canvas platform projects
  useEffect(() => {
    if (projects.length > 0) {
      setLocalProjects(prev => {
        // Filter hook projects to only canvas platform
        const canvasProjects = projects.filter(p => p.platform === 'canvas');
        const hookProjectsMap = new Map(canvasProjects.map(p => [p.id, p]));
        
        // Start with filtered canvas projects from hook (source of truth from server)
        const merged = [...canvasProjects];
        
        // Add any local projects that aren't in hook yet (newly created, not yet synced)
        // But only if they're canvas platform projects
        prev.forEach(localProject => {
          if (localProject.platform === 'canvas' && !hookProjectsMap.has(localProject.id)) {
            merged.push(localProject);
          }
        });
        
        // Sort by createdAt (newest first)
        return merged.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }
  }, [projects]);

  // Filter projects by search and ensure only canvas platform projects
  const filteredProjects = useMemo(() => 
    localProjects
      .filter(project => project.platform === 'canvas') // ✅ Ensure only canvas projects
      .filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.slug.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [localProjects, searchQuery]
  );

  // Get selected project
  const currentProject = useMemo(() => 
    localProjects.find(p => p.id === selectedProjectId),
    [localProjects, selectedProjectId]
  );

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleFileSelect = (file: CanvasFile) => {
    if (currentProject) {
      router.push(`/canvas/${currentProject.slug}/${file.id}`);
    }
  };

  const handleCreateProject = (newProject: Project) => {
    // Only add if it's a canvas platform project
    if (newProject.platform === 'canvas') {
      setLocalProjects(prev => [newProject, ...prev]);
      setSelectedProjectId(newProject.id);
      refetchProjects();
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditProjectModalOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setDeleteProjectDialogOpen(true);
  };

  const handleDuplicateProject = (project: Project) => {
    setSelectedProject(project);
    setDuplicateProjectModalOpen(true);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    setLocalProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    refetchProjects();
    setEditProjectModalOpen(false);
    setSelectedProject(null);
  };

  const handleProjectDeleted = async () => {
    if (selectedProject) {
      const result = await removeProject(selectedProject.id);
      if (result.success) {
        setLocalProjects(prev => prev.filter(p => p.id !== selectedProject.id));
        if (selectedProjectId === selectedProject.id) {
          setSelectedProjectId(null);
        }
        toast.success('Project deleted successfully');
        refetchProjects(); // Refresh from server
      }
    }
    setDeleteProjectDialogOpen(false);
    setSelectedProject(null);
  };

  const handleProjectDuplicated = (duplicatedProject: Project) => {
    setLocalProjects(prev => [duplicatedProject, ...prev]);
    setSelectedProjectId(duplicatedProject.id);
    setDuplicateProjectModalOpen(false);
    setSelectedProject(null);
    refetchProjects();
  };

  const handleCreateFile = async (data: { name: string; slug: string; description?: string }) => {
    if (!selectedProjectId) return;
    
    setIsCreatingFile(true);
    try {
      const result = await createFile({
        projectId: selectedProjectId,
        ...data,
      });

      if (result.success) {
        // Track canvas file created
        trackProjectCreated('canvas');
        
        refetchProjectFiles();
        if (result.data && currentProject) {
          router.push(`/canvas/${currentProject.slug}/${result.data.id}`);
        }
      }
    } finally {
      setIsCreatingFile(false);
    }
  };

  const handleEditFile = (file: CanvasFile) => {
    setSelectedFile(file);
    setEditFileModalOpen(true);
  };

  const handleDeleteFile = (file: CanvasFile) => {
    setSelectedFile(file);
    setDeleteFileDialogOpen(true);
  };

  const handleDuplicateFile = (file: CanvasFile) => {
    setSelectedFile(file);
    setDuplicateFileModalOpen(true);
  };

  const handleFileUpdated = () => {
    refetchProjectFiles();
    setEditFileModalOpen(false);
    setSelectedFile(null);
  };

  const handleFileDeleted = async () => {
    if (selectedFile) {
      const result = await deleteFile(selectedFile.id);
      if (result.success) {
        refetchProjectFiles();
        toast.success('Canvas file deleted successfully');
      }
    }
    setDeleteFileDialogOpen(false);
    setSelectedFile(null);
  };

  const handleFileDuplicated = async (newName?: string) => {
    if (selectedFile) {
      const result = await duplicateFile(selectedFile.id, newName);
      if (result.success) {
        refetchProjectFiles();
        if (result.data && currentProject) {
          router.push(`/canvas/${currentProject.slug}/${result.data.id}`);
        }
      }
    }
    setDuplicateFileModalOpen(false);
    setSelectedFile(null);
  };

  // Auto-open sidebar on desktop, keep closed on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      className={cn(
        "fixed inset-0 bg-background pt-[var(--navbar-height)] overflow-hidden",
        "flex flex-col h-[calc(100vh-var(--navbar-height))]"
      )}
    >
      {/* Main Content Grid */}
      <div className={cn(
        "flex-1 overflow-hidden grid",
        isSidebarOpen ? "grid-cols-[auto_1fr]" : "grid-cols-[3rem_1fr]"
      )}>
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
            {/* Projects List */}
            <ScrollArea className="overflow-y-auto min-h-0">
              <div className="p-2 space-y-1 flex flex-col items-start">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className={cn(
                      "group flex items-center gap-2 rounded-md text-sm transition-colors",
                      selectedProjectId === project.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <button
                      onClick={() => handleProjectSelect(project.id)}
                      className="flex-1 text-left px-3 py-2 rounded-md flex items-center gap-2 min-w-0"
                    >
                      <FolderOpen className="h-4 w-4 shrink-0" />
                      <span className="truncate">{project.name}</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                            selectedProjectId === project.id && "opacity-100"
                          )}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProject(project)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateProject(project)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                {filteredProjects.length === 0 && (
                  <div className="px-3 py-8 w-full text-center text-sm text-muted-foreground">
                    <CreateProjectModal platform="canvas" onProjectCreated={handleCreateProject}>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Plus className="h-3 w-3 mr-1.5" />
                        Create Project
                      </Button>
                    </CreateProjectModal>
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
        <header className="px-4 border-b h-16 flex items-center justify-between shrink-0 gap-3">
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
              {currentProject ? currentProject.name : 'Canvas Editor'}
            </h2>
            {/* Search and New Project in same row */}
            <div className="flex items-center gap-2 flex-1 min-w-0 max-w-md">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <CreateProjectModal platform="canvas" onProjectCreated={handleCreateProject}>
                <Button variant="outline" size="sm" className="h-9 shrink-0">
                  <Plus className="h-4 w-4 mr-1.5" />
                  New Project
                </Button>
              </CreateProjectModal>
            </div>
          </div>
          {selectedProjectId && (
            <CreateCanvasFileModal
              projectId={selectedProjectId}
              onFileCreated={handleCreateFile}
            >
              <Button
                disabled={isCreatingFile || fileOperationsLoading}
                className="shrink-0"
              >
                {isCreatingFile || fileOperationsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    New File
                  </>
                )}
              </Button>
            </CreateCanvasFileModal>
          )}
        </header>

        {/* Content Area */}
        <section className="overflow-y-auto w-full min-h-0">
          {selectedProjectId ? (
            <div className="p-4 sm:p-6">
              {filesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : projectFiles && projectFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {projectFiles.map((file) => (
                    <Card
                      key={file.id}
                      className="bg-card border-border hover:border-primary transition-colors group cursor-pointer"
                      onClick={() => handleFileSelect(file)}
                    >
                      {/* Thumbnail/Screenshot */}
                      {file.thumbnailUrl ? (
                        <div className="relative w-full aspect-video bg-muted overflow-hidden rounded-t-lg">
                          <img
                            src={file.thumbnailUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative w-full aspect-video bg-muted flex items-center justify-center rounded-t-lg">
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle 
                            className="text-card-foreground text-base line-clamp-1 flex-1"
                          >
                            {file.name}
                          </CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleFileSelect(file)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditFile(file)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateFile(file)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteFile(file)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {file.description && (
                          <CardDescription className="text-muted-foreground text-xs line-clamp-2 mt-1">
                            {file.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            v{file.version}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(file.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-12 w-12 text-muted mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No canvas files yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a new canvas file to start building your node workflow
                  </p>
                  <CreateCanvasFileModal
                    projectId={selectedProjectId}
                    onFileCreated={handleCreateFile}
                  >
                    <Button disabled={isCreatingFile || fileOperationsLoading}>
                      {isCreatingFile || fileOperationsLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Canvas File
                        </>
                      )}
                    </Button>
                  </CreateCanvasFileModal>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Folder className="h-16 w-16 text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Select a Project</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a project from the sidebar to view its canvas files
                </p>
                <CreateProjectModal platform="canvas" onProjectCreated={handleCreateProject}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </CreateProjectModal>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      {selectedProject && (
        <>
          <EditProjectModal
            project={selectedProject}
            open={editProjectModalOpen}
            onOpenChange={setEditProjectModalOpen}
            onProjectUpdated={handleProjectUpdated}
          />
          <DeleteProjectDialog
            project={selectedProject}
            open={deleteProjectDialogOpen}
            onOpenChange={setDeleteProjectDialogOpen}
            onConfirm={async () => handleProjectDeleted()}
          />
          <DuplicateProjectModal
            project={selectedProject}
            open={duplicateProjectModalOpen}
            onOpenChange={setDuplicateProjectModalOpen}
            onProjectDuplicated={handleProjectDuplicated}
          />
        </>
      )}

      {selectedFile && (
        <>
          <EditCanvasFileModal
            file={selectedFile}
            open={editFileModalOpen}
            onOpenChange={setEditFileModalOpen}
            onFileUpdated={handleFileUpdated}
          />
          <DeleteCanvasFileDialog
            file={selectedFile}
            open={deleteFileDialogOpen}
            onOpenChange={setDeleteFileDialogOpen}
            onConfirm={handleFileDeleted}
          />
          <DuplicateCanvasFileModal
            file={selectedFile}
            open={duplicateFileModalOpen}
            onOpenChange={setDuplicateFileModalOpen}
            onFileDuplicated={handleFileDuplicated}
          />
        </>
      )}
      </div>
    </div>
  );
}
