'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Type, Image as ImageIcon, Layers, Camera, Palette, Save, ChevronDown, FolderPlus, FileText, Sparkles, Undo2, Redo2, Download, Upload, Search, Layout, Play, Square } from 'lucide-react';
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
import { getProjectChains, createRenderChain } from '@/lib/actions/projects.actions';
import type { Project } from '@/lib/db/schema';

interface CanvasToolbarProps {
  projectId: string;
  projectSlug: string;
  projectName: string;
  chainId: string;
  chainName: string;
  onAddNode: (type: 'text' | 'image' | 'variants' | 'style' | 'material') => void;
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
  chainId, 
  chainName, 
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
  const [chains, setChains] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingChains, setLoadingChains] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showNewChainDialog, setShowNewChainDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newChainName, setNewChainName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch chains for current project
  const fetchChains = useCallback(async () => {
    if (!projectId) return;
    setLoadingChains(true);
    try {
      const result = await getProjectChains(projectId);
      if (result.success && result.data) {
        setChains(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch chains:', error);
    } finally {
      setLoadingChains(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjects();
    fetchChains();
  }, [fetchProjects, fetchChains]);

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
        // Navigate to new project's first chain or create one
        router.push(`/canvas/${result.data.slug}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleCreateChain = async () => {
    if (!newChainName.trim() || !projectId) return;
    
    try {
      const result = await createRenderChain(projectId, newChainName);
      if (result.success && result.data) {
        await fetchChains();
        setShowNewChainDialog(false);
        setNewChainName('');
        // Navigate to new chain
        router.push(`/canvas/${projectSlug}/${result.data.id}`);
      }
    } catch (error) {
      console.error('Failed to create chain:', error);
    }
  };

  const handleProjectSelect = (project: Project) => {
    router.push(`/canvas/${project.slug}`);
  };

  const handleChainSelect = (chain: any) => {
    router.push(`/canvas/${projectSlug}/${chain.id}`);
  };

  return (
    <div className="h-12 bg-card border-b border-border text-card-foreground flex items-center px-4 gap-4">
      {/* Project Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
          >
            <span className="text-sm font-medium">{projectName}</span>
            <ChevronDown className="h-3 w-3" />
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

      <span className="text-xs text-muted-foreground">/</span>

      {/* Chain/Render Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
          >
            <span className="text-sm text-muted-foreground">{chainName}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[400px] overflow-y-auto">
          <Dialog open={showNewChainDialog} onOpenChange={setShowNewChainDialog}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setShowNewChainDialog(true);
                }}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Render
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Render</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Render Name</Label>
                  <Input
                    value={newChainName}
                    onChange={(e) => setNewChainName(e.target.value)}
                    placeholder="Enter render name"
                  />
                </div>
                <Button
                  onClick={handleCreateChain}
                  className="w-full"
                >
                  Create Render
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenuSeparator />
          {loadingChains ? (
            <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
          ) : (
            chains.map((chain) => (
              <DropdownMenuItem
                key={chain.id}
                onClick={() => handleChainSelect(chain)}
                className={`cursor-pointer ${
                  chain.id === chainId ? 'bg-accent' : ''
                }`}
              >
                {chain.name || `Render ${chain.id.slice(0, 8)}`}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo Buttons */}
      {onUndo && onRedo && (
        <>
          <Button
            onClick={onUndo}
            variant="ghost"
            size="sm"
            disabled={!canUndo}
            className="h-8 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={onRedo}
            variant="ghost"
            size="sm"
            disabled={!canRedo}
            className="h-8 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
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
        <Save className="h-4 w-4 mr-2" />
        Save
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Search */}
      {onSearch && (
        <>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              className="h-8 w-48 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Separator orientation="vertical" className="h-6" />
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
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </Button>
          <Separator orientation="vertical" className="h-6" />
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
            <Play className="h-4 w-4 mr-2" />
            Execute
          </Button>
          <Separator orientation="vertical" className="h-6" />
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
              <Download className="h-4 w-4 mr-2" />
              Export
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
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </>
          )}
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Add Node Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          {/* Templates Section */}
          {onAddTemplate && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Templates
              </div>
              {Object.entries(NODE_TEMPLATES).map(([key, template]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onAddTemplate(key as keyof typeof NODE_TEMPLATES)}
                  className="cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  <div className="flex flex-col">
                    <span>{template.name}</span>
                    <span className="text-xs text-muted-foreground">{template.description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Individual Nodes Section */}
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Nodes
          </div>
          {Object.values(NODE_REGISTRY).map((nodeDef) => {
            const icons: Record<string, any> = {
              text: Type,
              image: ImageIcon,
              variants: Layers,
              style: Camera,
              material: Palette,
            };
            const Icon = icons[nodeDef.type] || Plus;
            
            return (
              <DropdownMenuItem
                key={nodeDef.type}
                onClick={() => onAddNode(nodeDef.type)}
                className="cursor-pointer"
              >
                <Icon className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span>{nodeDef.label}</span>
                  <span className="text-xs text-muted-foreground">{nodeDef.description}</span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

