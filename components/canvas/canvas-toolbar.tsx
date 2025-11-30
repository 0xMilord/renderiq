'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Type, Image as ImageIcon, Layers, Camera, Palette, Save, ChevronDown, FolderPlus } from 'lucide-react';
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
  onSave: () => void;
}

export function CanvasToolbar({ 
  projectId, 
  projectSlug, 
  projectName, 
  chainId, 
  chainName, 
  onAddNode,
  onSave 
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
    <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-4">
      {/* Project Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 bg-[#1e1e1e] hover:bg-[#3d3d3d] text-white border border-[#3d3d3d] gap-1"
          >
            <span className="text-sm font-medium">{projectName}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#252526] border-[#3d3d3d] text-white max-h-[400px] overflow-y-auto">
          <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setShowNewProjectDialog(true);
                }}
                className="hover:bg-[#094771] cursor-pointer"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Create New Project
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="bg-[#252526] border-[#3d3d3d] text-white">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Project Name</Label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="bg-[#1e1e1e] border-[#3d3d3d] text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Description (Optional)</Label>
                  <Textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description"
                    className="bg-[#1e1e1e] border-[#3d3d3d] text-white"
                  />
                </div>
                <Button
                  onClick={handleCreateProject}
                  className="w-full bg-[#0e639c] hover:bg-[#1177bb] text-white"
                >
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenuSeparator className="bg-[#3d3d3d]" />
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleProjectSelect(project)}
              className={`hover:bg-[#094771] cursor-pointer ${
                project.id === projectId ? 'bg-[#094771]' : ''
              }`}
            >
              {project.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="text-xs text-[#8c8c8c]">/</span>

      {/* Chain/Chat Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 bg-[#1e1e1e] hover:bg-[#3d3d3d] text-white border border-[#3d3d3d] gap-1"
          >
            <span className="text-sm text-[#8c8c8c]">{chainName}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#252526] border-[#3d3d3d] text-white max-h-[400px] overflow-y-auto">
          <Dialog open={showNewChainDialog} onOpenChange={setShowNewChainDialog}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setShowNewChainDialog(true);
                }}
                className="hover:bg-[#094771] cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Chat
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="bg-[#252526] border-[#3d3d3d] text-white">
              <DialogHeader>
                <DialogTitle>Create New Chat</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Chat Name</Label>
                  <Input
                    value={newChainName}
                    onChange={(e) => setNewChainName(e.target.value)}
                    placeholder="Enter chat name"
                    className="bg-[#1e1e1e] border-[#3d3d3d] text-white"
                  />
                </div>
                <Button
                  onClick={handleCreateChain}
                  className="w-full bg-[#0e639c] hover:bg-[#1177bb] text-white"
                >
                  Create Chat
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <DropdownMenuSeparator className="bg-[#3d3d3d]" />
          {loadingChains ? (
            <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
          ) : (
            chains.map((chain) => (
              <DropdownMenuItem
                key={chain.id}
                onClick={() => handleChainSelect(chain)}
                className={`hover:bg-[#094771] cursor-pointer ${
                  chain.id === chainId ? 'bg-[#094771]' : ''
                }`}
              >
                {chain.name || `Chat ${chain.id.slice(0, 8)}`}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 bg-[#3d3d3d]" />

      {/* Save Button */}
      <Button
        onClick={onSave}
        variant="ghost"
        size="sm"
        className="h-8 bg-[#0e639c] hover:bg-[#1177bb] text-white border border-[#0e639c]"
      >
        <Save className="h-4 w-4 mr-2" />
        Save
      </Button>

      <Separator orientation="vertical" className="h-6 bg-[#3d3d3d]" />

      {/* Add Node Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 bg-[#1e1e1e] hover:bg-[#3d3d3d] text-white border border-[#3d3d3d]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#252526] border-[#3d3d3d] text-white">
          <DropdownMenuItem
            onClick={() => onAddNode('text')}
            className="hover:bg-[#094771] cursor-pointer"
          >
            <Type className="h-4 w-4 mr-2" />
            Text Node
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAddNode('image')}
            className="hover:bg-[#094771] cursor-pointer"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Image Node
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAddNode('variants')}
            className="hover:bg-[#094771] cursor-pointer"
          >
            <Layers className="h-4 w-4 mr-2" />
            Variants Node
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAddNode('style')}
            className="hover:bg-[#094771] cursor-pointer"
          >
            <Camera className="h-4 w-4 mr-2" />
            Style Node
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAddNode('material')}
            className="hover:bg-[#094771] cursor-pointer"
          >
            <Palette className="h-4 w-4 mr-2" />
            Material Node
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

