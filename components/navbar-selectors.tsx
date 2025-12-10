'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useProjects } from '@/lib/hooks/use-projects';
import { useProjectChains } from '@/lib/hooks/use-render-chain';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderOpen, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavbarSelectors() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  
  const { projects, loading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Detect current project from URL first to load chains
  const currentProjectSlug = useMemo(() => {
    // Pattern: /project/[projectSlug]/chain/[chainId] (new unified route)
    // Pattern: /canvas/[projectSlug]/[chatId]
    // Pattern: /dashboard/projects/[slug]
    
    const parts = pathname.split('/').filter(Boolean);
    
    // Check for /project/[projectSlug]/chain/[chainId] (new unified route)
    if (pathname.startsWith('/project/')) {
      if (parts.length >= 2 && parts[0] === 'project') {
        return parts[1];
      }
    }
    
    // Check for /dashboard/projects/[slug]
    if (pathname.startsWith('/dashboard/projects/')) {
      const slugIndex = parts.indexOf('projects');
      if (slugIndex !== -1 && slugIndex + 1 < parts.length) {
        return parts[slugIndex + 1];
      }
    }
    
    // Check for /canvas/[projectSlug]/[fileId] (fileId contains file slug)
    if (pathname.startsWith('/canvas/')) {
      if (parts.length >= 2 && parts[0] === 'canvas') {
        return parts[1];
      }
    }
    
    // Check params for projectSlug (for dynamic routes)
    if (params?.projectSlug) {
      return params.projectSlug as string;
    }
    
    return null;
  }, [pathname, params]);
  
  // Find current project by slug
  const currentProject = useMemo(() => {
    if (!currentProjectSlug) return null;
    return projects.find(p => p.slug === currentProjectSlug) || null;
  }, [currentProjectSlug, projects]);
  
  // Use current project ID for loading chains if no selected project
  const projectIdForChains = selectedProjectId || currentProject?.id || null;
  
  // Get chains for selected or current project
  const { chains, loading: chainsLoading } = useProjectChains(projectIdForChains);
  
  // Detect current chain from URL
  const currentChainId = useMemo(() => {
    if (params?.chainId) return params.chainId as string;
    if (params?.chatId) return params.chatId as string;
    
    // Check query params
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('chain') || null;
    }
    return null;
  }, [params]);
  
  // Set selected project when current project changes
  useEffect(() => {
    if (currentProject) {
      setSelectedProjectId(currentProject.id);
    }
  }, [currentProject]);
  
  // Handle project selection - navigate to project page
  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProjectId(projectId);
      // Navigate to unified project page
      router.push(`/project/${project.slug}`);
    }
  };
  
  // Handle chain selection - navigate to chain page
  const handleChainChange = (chainId: string) => {
    // Find the project that owns this chain
    const selectedChain = chains.find(c => c.id === chainId);
    
    if (selectedChain) {
      // Find the project by the chain's projectId
      const project = projects.find(p => p.id === selectedChain.projectId);
      
      if (project) {
        // Navigate to unified project/chain route
        router.push(`/project/${project.slug}/chain/${chainId}`);
        return;
      }
    }
    
    // Fallback: Use selected project ID or current project
    const projectId = selectedProjectId || currentProject?.id;
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
      // Navigate to unified project/chain route
      router.push(`/project/${project.slug}/chain/${chainId}`);
    }
  };
  
  // Available chains for the selected or current project
  const availableChains = useMemo(() => {
    return chains;
  }, [chains]);
  
  return (
    <div className="hidden md:flex items-center gap-2">
      {/* Project Selector */}
      <Select
        value={selectedProjectId || currentProject?.id || ''}
        onValueChange={handleProjectChange}
        disabled={projectsLoading}
      >
        <SelectTrigger className="h-8 w-[160px] border border-border bg-background hover:bg-accent text-sm min-w-0 overflow-hidden">
          {projectsLoading ? (
            <div className="flex items-center gap-2 min-w-0">
              <Loader2 className="h-3 w-3 animate-spin shrink-0" />
              <span className="text-xs text-muted-foreground truncate">Loading...</span>
            </div>
          ) : (
            <>
              <FolderOpen className="h-3 w-3 mr-2 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Select Project" className="truncate">
                {currentProject 
                  ? currentProject.name 
                  : selectedProjectId 
                    ? projects.find(p => p.id === selectedProjectId)?.name || 'Select Project'
                    : 'Select Project'}
              </SelectValue>
            </>
          )}
        </SelectTrigger>
        <SelectContent>
          {projects.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No projects yet
            </div>
          ) : (
            projects.map((project) => (
              <SelectItem
                key={project.id}
                value={project.id}
                className={cn(
                  "cursor-pointer",
                  currentProject?.id === project.id && "bg-accent"
                )}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-3 w-3" />
                  <span className="text-sm">{project.name}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {/* Separator */}
      {(selectedProjectId || currentProject) && (
        <span className="text-muted-foreground font-medium text-sm shrink-0">/</span>
      )}
      
      {/* Chain Selector - Only show if a project is selected or current */}
      {(selectedProjectId || currentProject) && (
        <Select
          value={currentChainId || ''}
          onValueChange={handleChainChange}
          disabled={chainsLoading || !projectIdForChains}
        >
          <SelectTrigger className="h-8 w-[160px] border border-border bg-background hover:bg-accent text-sm min-w-0 overflow-hidden">
            {chainsLoading ? (
              <div className="flex items-center gap-2 min-w-0">
                <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                <span className="text-xs text-muted-foreground truncate">Loading...</span>
              </div>
            ) : (
              <>
                <MessageSquare className="h-3 w-3 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Select Chat" className="truncate">
                  {currentChainId 
                    ? availableChains.find(c => c.id === currentChainId)?.name || 'Chat'
                    : 'Select Chat'}
                </SelectValue>
              </>
            )}
          </SelectTrigger>
          <SelectContent>
            {availableChains.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {chainsLoading ? 'Loading chats...' : 'No chats yet'}
              </div>
            ) : (
              availableChains.map((chain) => (
                <SelectItem
                  key={chain.id}
                  value={chain.id}
                  className={cn(
                    "cursor-pointer",
                    currentChainId === chain.id && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    <span className="text-sm">{chain.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
