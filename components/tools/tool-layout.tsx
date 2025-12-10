'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FolderOpen, Loader2, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToolConfig } from '@/lib/tools/registry';
import { useProjects } from '@/lib/hooks/use-projects';
import { createProject } from '@/lib/actions/projects.actions';
import { logger } from '@/lib/utils/logger';

interface ToolLayoutProps {
  tool: ToolConfig;
  children: React.ReactNode;
  onProjectChange?: (projectId: string) => void;
  hintMessage?: string | null;
}

export function ToolLayout({ tool, children, onProjectChange, hintMessage }: ToolLayoutProps) {
  const { projects, loading: projectsLoading, refetch } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    onProjectChange?.(value);
  };

  const handleCreateProject = async () => {
    setCreatingProject(true);
    try {
      // Generate project name: tool-toolname-date
      const toolSlug = tool.slug || tool.id.replace(/-/g, '');
      const date = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      const projectName = `tool-${toolSlug}-${date}`;
      
      const formData = new FormData();
      formData.append('projectName', projectName);
      formData.append('description', `Project for ${tool.name} tool`);
      formData.append('isToolsProject', 'true');
      
      const result = await createProject(formData);
      
      if (result.success && result.data) {
        await refetch(); // Refresh projects list
        setSelectedProjectId(result.data.id);
        onProjectChange?.(result.data.id);
        logger.log('✅ Created project:', projectName);
      } else {
        logger.error('❌ Failed to create project:', result.error);
      }
    } catch (error) {
      logger.error('❌ Error creating project:', error);
    } finally {
      setCreatingProject(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Fixed below navbar */}
      <div className="border-b fixed top-[var(--navbar-height)] left-0 right-0 z-10 w-full pointer-events-none bg-background">
        <div className="w-full max-w-[1920px] mx-auto px-4 pt-2 pb-1 pointer-events-auto">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Back Button - Auto width (hugging) */}
            <Link href="/apps">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            
            {/* Vertical Separator */}
            <div className="h-6 w-px bg-border shrink-0"></div>
            
            {/* Title and Description - Flex grow */}
            <div className="text-left flex-1 min-w-0">
              <h1 className="text-xl font-bold mb-0.5 leading-tight">{tool.name}</h1>
              <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
            </div>
            
            {/* Project Selector - Auto width (hugging) */}
            <div className="shrink-0 flex items-center gap-2">
              {/* Hint Badge - Left side of Project Selector */}
              {hintMessage && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium whitespace-nowrap">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span className="max-w-[200px] truncate">{hintMessage}</span>
                </div>
              )}
              <Select
                value={selectedProjectId || ''}
                onValueChange={handleProjectChange}
                disabled={projectsLoading || creatingProject}
              >
                <SelectTrigger className="h-8 min-w-[140px] max-w-[200px] text-sm min-w-0 overflow-hidden">
                  {projectsLoading || creatingProject ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{creatingProject ? 'Creating...' : 'Loading...'}</span>
                    </div>
                  ) : (
                    <>
                      <FolderOpen className="h-3 w-3 mr-2 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="Select Project" className="truncate">
                        {selectedProject?.name || 'Select Project'}
                      </SelectValue>
                    </>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={handleCreateProject}
                disabled={projectsLoading || creatingProject}
                title="Create new project for this tool"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden flex flex-col gap-1">
            {/* Row 1: Back Button + Tool Title + Project Selector + New Button */}
            <div className="flex items-center gap-2">
              <Link href="/apps">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold leading-tight truncate">{tool.name}</h1>
              </div>
              <Select
                value={selectedProjectId || ''}
                onValueChange={handleProjectChange}
                disabled={projectsLoading || creatingProject}
              >
                <SelectTrigger className="h-8 min-w-[120px] max-w-[140px] text-sm shrink-0">
                  {projectsLoading || creatingProject ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{creatingProject ? 'Creating...' : 'Loading...'}</span>
                    </div>
                  ) : (
                    <>
                      <FolderOpen className="h-3 w-3 mr-2 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="Select Project" className="truncate">
                        {selectedProject?.name || 'Select Project'}
                      </SelectValue>
                    </>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 shrink-0"
                onClick={handleCreateProject}
                disabled={projectsLoading || creatingProject}
                title="Create new project for this tool"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Row 2: Hint Badge - Own Row, Full Width */}
            {hintMessage && (
              <div className="w-full">
                <div className="w-full inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span className="truncate flex-1">{hintMessage}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Adjusted to account for header */}
      <div className="w-full max-w-[1920px] mx-auto px-4 py-8 pt-[calc(var(--navbar-height)+3.25rem+1.5rem)] min-h-[90vh]">
        {children}
      </div>
    </div>
  );
}

