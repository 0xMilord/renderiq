'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Type, Image as ImageIcon, Layers, Camera, Palette, Save, ChevronDown, FolderPlus, FileText, Sparkles, Undo2, Redo2, Download, Upload, Search, Layout, Play, Square, CheckCircle, BookOpen, Video } from 'lucide-react';
import { NodeFactory, NODE_TEMPLATES, NODE_REGISTRY } from '@/lib/canvas/node-factory';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getUserProjects, createProject } from '@/lib/actions/projects.actions';
import { getCanvasFilesAction } from '@/lib/actions/canvas-files.actions';
import { useCanvasFileOperations } from '@/lib/hooks/use-canvas-files';
import type { Project } from '@/lib/db/schema';
import type { CanvasFile } from '@/lib/db/schema';

interface CanvasToolbarProps {
  projectId: string;
  projectSlug: string;
  projectName: string;
  fileId: string;
  fileName: string;
  onAddNode: (type: 'text' | 'image' | 'variants' | 'style' | 'material' | 'output' | 'prompt-builder' | 'style-reference' | 'image-input' | 'video') => void;
  onAddTemplate?: (templateName: keyof typeof NODE_TEMPLATES) => void;
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onExport?: () => void;
  onImport?: (file: File) => void;
  onAutoLayout?: () => void;
  onExecute?: () => void;
  onSearch?: (query: string) => void;
}

export function CanvasToolbar({ 
  projectId, 
  projectSlug, 
  projectName, 
  fileId,
  fileName,
  onAddNode,
  onAddTemplate,
  onSave,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onExport,
  onImport,
  onAutoLayout,
  onExecute,
  onSearch,
}: CanvasToolbarProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<CanvasFile[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileDescription, setNewFileDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createFile } = useCanvasFileOperations();

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const result = await getUserProjects();
      if (result.success && result.data) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Fetch canvas files for current project
  const fetchFiles = useCallback(async () => {
    if (!projectId) return;
    setLoadingFiles(true);
    try {
      const result = await getCanvasFilesAction({ projectId });
      if (result.success && result.files) {
        setFiles(result.files);
      }
    } catch (error) {
      console.error('Failed to fetch canvas files:', error);
    } finally {
      setLoadingFiles(false);
    }
  }, [projectId]);

  // ✅ FIXED: Only fetch on mount and when projectId changes
  // fetchProjects and fetchFiles are stable (memoized with useCallback), so we don't need them in deps
  useEffect(() => {
    fetchProjects();
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); [fetchProjects, fetchFiles]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      const formData = new FormData();
      formData.append('projectName', newProjectName);
      formData.append('description', newProjectDescription);
      
      const result = await createProject(formData);
      if (result.success && result.data) {
        await fetchProjects();
        setShowNewProjectDialog(false);
        setNewProjectName('');
        setNewProjectDescription('');
        // Navigate to canvas home for the new project
        router.push(`/canvas`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !projectId) return;
    
    try {
      // Generate slug from name
      const slug = newFileName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);

      const result = await createFile({
        projectId,
        name: newFileName,
        slug,
        description: newFileDescription.trim() || undefined,
      });

      if (result.success && result.data) {
        await fetchFiles();
        setShowNewFileDialog(false);
        setNewFileName('');
        setNewFileDescription('');
        // Navigate to new file
        router.push(`/canvas/${projectSlug}/${result.data.id}`);
      }
    } catch (error) {
      console.error('Failed to create canvas file:', error);
    }
  };

  const handleProjectSelect = (project: Project) => {
    router.push(`/canvas`);
  };

  const handleFileSelect = (file: CanvasFile) => {
    router.push(`/canvas/${projectSlug}/${file.id}`);
  };

  return (
    <div className="min-h-12 bg-card border-b border-border text-card-foreground flex flex-wrap items-center px-2 sm:px-4 gap-2 py-2">
      {/* Row 1: Project/Chain Navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Project Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs sm:text-sm"
            >
              <span className="font-medium truncate max-w-[100px] sm:max-w-none">{projectName}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[400px] overflow-y-auto">
          <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setShowNewProjectDialog(true);
                }}
                className="cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Create New Project
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Project Name</Label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description"
                  />
                </div>
                <Button
                  onClick={handleCreateProject}
                  className="w-full"
                >
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenuSeparator />
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleProjectSelect(project)}
              className={`cursor-pointer ${
                project.id === projectId ? 'bg-accent' : ''
              }`}
            >
              {project.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

        <span className="text-xs text-muted-foreground shrink-0">/</span>

        {/* Canvas File Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs sm:text-sm"
            >
              <span className="text-muted-foreground truncate max-w-[80px] sm:max-w-none">
                {fileName || 'Select File'}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[400px] overflow-y-auto">
          <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setShowNewFileDialog(true);
                }}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Canvas File
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Canvas File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>File Name</Label>
                  <Input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Enter file name"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={newFileDescription}
                    onChange={(e) => setNewFileDescription(e.target.value)}
                    placeholder="Enter file description"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleCreateFile}
                  className="w-full"
                >
                  Create File
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenuSeparator />
          {loadingFiles ? (
            <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
          ) : files.length === 0 ? (
            <DropdownMenuItem disabled>No files yet</DropdownMenuItem>
          ) : (
            files.map((file) => (
              <DropdownMenuItem
                key={file.id}
                onClick={() => handleFileSelect(file)}
                className={`cursor-pointer ${
                  file.id === fileId ? 'bg-accent' : ''
                }`}
              >
                {file.name || file.slug}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>

      {/* Row 1/2: Action Buttons - Wrap to second row on mobile */}
      <div className="flex items-center gap-2 flex-wrap">
        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Undo/Redo Buttons */}
        {onUndo && onRedo && (
          <>
            <Button
              onClick={onUndo}
              variant="ghost"
              size="sm"
              disabled={!canUndo}
              className="h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={onRedo}
              variant="ghost"
              size="sm"
              disabled={!canRedo}
              className="h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
          </>
        )}

        {/* Save Button */}
        <Button
          onClick={onSave}
          variant="ghost"
          size="sm"
          className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
          title="Save (Ctrl+S)"
        >
          <Save className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Save</span>
        </Button>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Search */}
        {onSearch && (
          <>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch(e.target.value);
                }}
                className="h-8 w-32 sm:w-48 bg-background border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm"
              />
            </div>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
          </>
        )}

        {/* Auto Layout */}
        {onAutoLayout && (
          <>
            <Button
              onClick={onAutoLayout}
              variant="ghost"
              size="sm"
              className="h-8"
              title="Auto Layout (Ctrl+L)"
            >
              <Layout className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Layout</span>
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
          </>
        )}

        {/* Execute */}
        {onExecute && (
          <>
            <Button
              onClick={onExecute}
              variant="ghost"
              size="sm"
              className="h-8 bg-primary/10 hover:bg-primary/20 text-primary"
              title="Execute Workflow (Ctrl+E)"
            >
              <Play className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Execute</span>
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
          </>
        )}

        {/* Export/Import */}
        {(onExport || onImport) && (
          <>
            {onExport && (
              <Button
                onClick={onExport}
                variant="ghost"
                size="sm"
                className="h-8"
                title="Export Workflow"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            {onImport && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onImport) {
                      onImport(file);
                    }
                  }}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  title="Import Workflow"
                >
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
              </>
            )}
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
          </>
        )}

        {/* Add Template Dropdown */}
        {onAddTemplate && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
              >
                <Sparkles className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Templates</span>
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            {Object.entries(NODE_TEMPLATES).map(([key, template]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onAddTemplate(key as keyof typeof NODE_TEMPLATES)}
                className="cursor-pointer"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                <span>{template.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        {/* Add Node Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Node</span>
            </Button>
          </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          {Object.values(NODE_REGISTRY).map((nodeDef) => {
            const icons: Record<string, any> = {
              text: Type,
              image: ImageIcon,
              variants: Layers,
              style: Camera,
              material: Palette,
              output: CheckCircle,
              'prompt-builder': Sparkles,
              'style-reference': BookOpen,
              'image-input': ImageIcon,
              video: Video,
            };
            const Icon = icons[nodeDef.type] || Plus;
            
            return (
              <DropdownMenuItem
                key={nodeDef.type}
                onClick={() => onAddNode(nodeDef.type)}
                className="cursor-pointer"
              >
                <Icon className="h-4 w-4 mr-2" />
                <span>{nodeDef.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  );
}

