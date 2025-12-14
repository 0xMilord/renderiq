'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Calendar, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  Image as ImageIcon,
  Video,
  MessageSquare,
  FolderOpen
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Project } from '@/lib/db/schema';
import { EditProjectModal } from './edit-project-modal';
import { DeleteProjectDialog } from './delete-project-dialog';
import { DuplicateProjectModal } from './duplicate-project-modal';
import { TldrawSnapshotImage } from '@/components/canvas/tldraw-snapshot-image';
import type { TLStoreSnapshot } from '@tldraw/tldraw';

interface LatestRender {
  id: string;
  outputUrl: string | null;
  status: string;
  type: 'image' | 'video';
  createdAt: Date;
}

interface ChainWithSnapshot {
  id: string;
  projectId: string;
  snapshot?: any; // TLStoreSnapshot from latest render's contextData
}

interface ProjectCardProps {
  project: Project & { 
    renderCount?: number;
    latestRenders?: LatestRender[];
  };
  viewMode: 'default' | 'compact' | 'list' | 'sidebar' | 'micro';
  onEdit?: (project: Project) => void;
  onDuplicate?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onSelect?: (project: Project) => void;
  viewUrl?: string; // Custom view URL, defaults to /dashboard/projects/{slug}
  chains?: Array<{ id: string; projectId: string }>; // Optional chains to find first chain for "Continue on Chat"
  chainsWithSnapshots?: ChainWithSnapshot[]; // ✅ NEW: Chains with their tldraw snapshots for display
  imageAspect?: 'square' | 'video'; // Override image aspect (e.g., 16:9 in sidebar)
}

function ProjectCardComponent({ 
  project, 
  viewMode, 
  onEdit, 
  onDuplicate, 
  onDelete,
  onSelect,
  viewUrl,
  chains,
  chainsWithSnapshots,
  imageAspect,
}: ProjectCardProps) {
  // Default view URL to dashboard, but allow override
  const defaultViewUrl = `/dashboard/projects/${project.slug}`;
  const finalViewUrl = viewUrl || defaultViewUrl;
  const latestRenders = project.latestRenders || [];
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toSentenceCase = (text: string) => {
    if (!text) return text;
    // Convert to sentence case: first letter uppercase, rest lowercase
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  // Get platform badge info
  const getPlatformBadge = () => {
    const platform = project.platform || 'render';
    switch (platform) {
      case 'render':
        return { label: 'Render', variant: 'default' as const, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' };
      case 'tools':
        return { label: 'Tools', variant: 'secondary' as const, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' };
      case 'canvas':
        return { label: 'Canvas', variant: 'outline' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
      default:
        return { label: 'Render', variant: 'default' as const, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' };
    }
  };

  // Get navigation URL based on platform
  const getPlatformUrl = () => {
    const platform = project.platform || 'render';
    switch (platform) {
      case 'render':
        return `/render`; // Render page will handle project selection
      case 'tools':
        return `/apps`; // Tools page
      case 'canvas':
        return `/canvas`; // Canvas page
      default:
        return `/dashboard/projects/${project.slug}`;
    }
  };

  const platformBadge = getPlatformBadge();
  const platformUrl = getPlatformUrl();

  // Get "Continue on Chat" URL - navigate to first chain or render page
  const getContinueChatUrl = () => {
    if (chains && chains.length > 0) {
      // Find first chain for this project
      const firstChain = chains.find(c => c.projectId === project.id);
      if (firstChain) {
        return `/project/${project.slug}/chain/${firstChain.id}`;
      }
    }
    // Fallback to render page - it will handle project selection
    return `/render`;
  };

  // Determine image aspect ratio
  const resolvedAspect = imageAspect ?? (viewMode === 'compact' ? 'square' : 'video');
  const aspectClass = resolvedAspect === 'video' ? 'aspect-video' : 'aspect-square';

  const renderImageGrid = () => {
    // ✅ PRIORITY: Show chain snapshots if available (multiple chains = multiple snapshots)
    if (chainsWithSnapshots && chainsWithSnapshots.length > 0) {
      const chainsWithValidSnapshots = chainsWithSnapshots.filter(c => c.snapshot);
      
      if (chainsWithValidSnapshots.length > 0) {
        const maxDisplaySnapshots = 4;
        const snapshotsToShow = chainsWithValidSnapshots.slice(0, maxDisplaySnapshots);
        const remainingCount = chainsWithSnapshots.length - snapshotsToShow.length;

        // 1 snapshot: full width
        if (snapshotsToShow.length === 1) {
          return (
            <div className="w-full h-full rounded-md overflow-hidden">
              <TldrawSnapshotImage
                snapshot={snapshotsToShow[0].snapshot}
                width={400}
                height={225}
                format="png"
                className="w-full h-full"
              />
            </div>
          );
        }

        // 2+ snapshots: grid layout
        return (
          <div className="grid grid-cols-2 gap-1 w-full h-full rounded-md overflow-hidden">
            {snapshotsToShow.map((chain, index) => (
              <div key={chain.id} className="relative bg-muted rounded-md overflow-hidden w-full h-full">
                <TldrawSnapshotImage
                  snapshot={chain.snapshot}
                  width={200}
                  height={112}
                  format="png"
                  className="w-full h-full"
                />
                {/* Show +N overlay on the 4th snapshot if there are more chains */}
                {index === 3 && remainingCount > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
    }

    // Fallback: Show render images if no chain snapshots available
    // Filter out failed renders (should already be filtered in DAL, but double-check)
    const validRenders = latestRenders.filter(r => r.status !== 'failed' && r.outputUrl);
    
    if (validRenders.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted rounded">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      );
    }

    // In compact view, show only the latest successful render
    if (viewMode === 'compact') {
      const latestRender = validRenders[0];
      return (
        <div className="w-full h-full flex items-center justify-center rounded-md overflow-hidden">
          {latestRender?.outputUrl ? (
            <img
              src={latestRender.outputUrl}
              alt="Latest render"
              className="w-full h-full object-cover rounded-md"
              width={48}
              suppressHydrationWarning
              height={48}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      );
    }

    // Default view: smart layout based on number of renders
    const renderCount = validRenders.length;
    const maxDisplayImages = 4;
    const imagesToShow = validRenders.slice(0, maxDisplayImages);
    const remainingCount = project.renderCount ? Math.max(0, project.renderCount - imagesToShow.length) : 0;

    // 1 render: full image
    if (renderCount === 1) {
      const render = validRenders[0];
      return (
        <div className="w-full h-full rounded-md overflow-hidden">
          {render?.outputUrl ? (
            <img
              src={render.outputUrl}
              alt="Render"
              className="w-full h-full object-cover"
              suppressHydrationWarning
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      );
    }

    // 2 renders: 2 columns side by side
    if (renderCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-1 w-full h-full rounded-md overflow-hidden">
          {validRenders.map((render, index) => (
            <div key={render.id} className="relative bg-muted rounded-md overflow-hidden w-full h-full">
              {render.outputUrl ? (
                <img
                  src={render.outputUrl}
                  alt={`Render ${index + 1}`}
                  className="w-full h-full object-cover"
                  suppressHydrationWarning
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {render.type === 'video' ? (
                    <Video className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // 3 renders: 2 on top row, 1 on bottom row
    if (renderCount === 3) {
      return (
        <div className="grid grid-cols-2 gap-1 w-full h-full rounded-md overflow-hidden">
          {/* Top row: 2 images */}
          {validRenders.slice(0, 2).map((render, index) => (
            <div key={render.id} className="relative bg-muted rounded-md overflow-hidden w-full h-full">
              {render.outputUrl ? (
                <img
                  src={render.outputUrl}
                  alt={`Render ${index + 1}`}
                  className="w-full h-full object-cover"
                  suppressHydrationWarning
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {render.type === 'video' ? (
                    <Video className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          ))}
          {/* Bottom row: 1 image (left column) */}
          <div className="relative bg-muted rounded-md overflow-hidden w-full h-full">
            {validRenders[2]?.outputUrl ? (
              <img
                src={validRenders[2].outputUrl}
                alt="Render 3"
                className="w-full h-full object-cover"
                suppressHydrationWarning
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {validRenders[2]?.type === 'video' ? (
                  <Video className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ImageIcon className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          {/* Empty slot for bottom right */}
          <div className="relative bg-muted rounded-md overflow-hidden w-full h-full">
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-3 w-3 text-muted-foreground opacity-0" />
            </div>
          </div>
        </div>
      );
    }

    // 4+ renders: 2x2 grid with +N overlay on last image if more than 4
    return (
      <div className="grid grid-cols-2 gap-1 w-full h-full rounded-md overflow-hidden">
        {imagesToShow.map((render, index) => (
          <div key={render.id} className="relative bg-muted rounded-md overflow-hidden w-full h-full">
            {render.outputUrl ? (
              <>
                <img
                  src={render.outputUrl}
                  alt={`Render ${index + 1}`}
                  className="w-full h-full object-cover"
                  suppressHydrationWarning
                />
                {/* Show +N overlay on the 4th image if there are more renders */}
                {index === 3 && remainingCount > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {render.type === 'video' ? (
                  <Video className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ImageIcon className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleImageClick = () => {
    if (onSelect) {
      onSelect(project);
    } else {
      // Navigate to platform-specific page
      window.location.href = platformUrl;
    }
  };

  // Get valid renders for image display
  const validRenders = latestRenders.filter(r => r.status !== 'failed' && r.outputUrl);

  if (viewMode === 'sidebar') {
    return (
      <Card 
        className={cn(
          "group hover:shadow-lg transition-all duration-200 w-full max-w-full overflow-hidden gap-0"
        )}
      >
        <CardContent className="p-2 w-full min-w-0 max-w-full overflow-hidden">
          {/* Image + Title/Description - No action buttons in sidebar */}
          <div className="flex gap-2 items-center w-full min-w-0 max-w-full overflow-hidden box-border">
            <div 
              className="relative w-[54px] h-[54px] flex-shrink-0 cursor-pointer rounded-md overflow-hidden bg-muted"
              onClick={handleImageClick}
            >
              {validRenders.length > 0 && validRenders[0]?.outputUrl ? (
                <img
                  src={validRenders[0].outputUrl}
                  alt={project.name}
                  className="w-full h-full object-cover"
                  suppressHydrationWarning
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {project.status !== 'processing' && (
                <div className="absolute -top-1 -right-1">
                  <Badge className={cn("text-[10px] px-1 py-0", getStatusColor(project.status))}>
                    {project.status}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5 overflow-hidden max-w-full box-border">
              <div className="flex items-center gap-2 min-w-0 w-full max-w-full box-border">
                <h3 className="font-medium text-sm truncate flex-1 min-w-0 max-w-full box-border">{toSentenceCase(project.name)}</h3>
                <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0 flex-shrink-0", platformBadge.color)}>
                  {platformBadge.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate w-full max-w-full box-border">
                {project.description || 'No description'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'micro') {
    // Get latest render thumbnail
    const latestRender = latestRenders.find(r => r.status !== 'failed' && r.outputUrl) || latestRenders[0];
    
    return (
      <Link 
        href={finalViewUrl}
        className="block"
        onClick={(e) => {
          if (onSelect) {
            e.preventDefault();
            onSelect(project);
          }
        }}
      >
        <div className="group flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-10 h-10 rounded-md bg-muted overflow-hidden flex items-center justify-center">
            {latestRender?.outputUrl ? (
              latestRender.type === 'video' ? (
                <video
                  src={latestRender.outputUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={latestRender.outputUrl}
                  alt={toSentenceCase(project.name)}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>';
                    }
                  }}
                />
              )
            ) : (
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-medium truncate">
                {toSentenceCase(project.name)}
              </h3>
              <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", platformBadge.color)}>
                {platformBadge.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {project.renderCount !== undefined && (
                <>
                  {project.renderCount > 0 ? (
                    <>
                      <ImageIcon className="h-3 w-3" />
                      <span>{project.renderCount} renders</span>
                    </>
                  ) : (
                    <span>No renders yet</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (viewMode === 'list') {
    return (
      <Card 
        className={cn(
          "group hover:shadow-lg transition-all duration-200"
        )}
      >
        <CardContent className="p-4">
          <div className="grid grid-cols-[auto,1fr] gap-3 items-center">
            <div 
              className="relative w-16 h-9 flex-shrink-0 cursor-pointer"
              onClick={handleImageClick}
            >
              <div className="w-full h-full bg-muted rounded-md overflow-hidden">
                {renderImageGrid()}
              </div>
              {project.status !== 'processing' && (
                <div className="absolute -top-1 -right-1">
                  <Badge className={cn("text-[10px] px-1 py-0", getStatusColor(project.status))}>
                    {project.status}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{toSentenceCase(project.name)}</h3>
                <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", platformBadge.color)}>
                  {platformBadge.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {project.description || 'No description'}
              </p>
              <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-2.5 w-2.5" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                <span>{project.renderCount || 0} renders</span>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {onSelect ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1"
                  title="View"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(project);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1.5" />
                  View
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1"
                  asChild
                  title="View"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={platformUrl}>
                    <Eye className="h-3 w-3 mr-1.5" />
                    View
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    title="More options"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDuplicateModalOpen(true);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default and compact view
  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-200 flex flex-col gap-0",
      viewMode === 'compact' ? "" : "h-full"
    )}
    >
      <div className={cn(
        "bg-muted relative group flex-shrink-0 rounded-t-lg overflow-hidden",
        aspectClass
      )}>
        <div 
          className="w-full h-full p-1 cursor-pointer"
          onClick={handleImageClick}
        >
          {renderImageGrid()}
        </div>
        {project.status !== 'processing' && (
          <div className="absolute top-2 right-2">
            <Badge className={cn("text-xs", getStatusColor(project.status))}>
              {project.status}
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="p-3 flex-shrink-0 gap-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <CardTitle className={cn(
            "text-sm flex-1",
            viewMode === 'compact' ? "line-clamp-1" : "line-clamp-2"
          )}>{toSentenceCase(project.name)}</CardTitle>
          <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", platformBadge.color)}>
            {platformBadge.label}
          </Badge>
        </div>
        <CardDescription className={cn(
          "text-xs",
          viewMode === 'compact' ? "line-clamp-1" : "line-clamp-2"
        )}>
          {project.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <div className="px-3">
        <div className="border-t border-border"></div>
      </div>
      <CardContent className="p-3 flex-shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {onSelect ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(project);
                }}
              >
                <Eye className="h-3 w-3 mr-1.5" />
                View
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex-1"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={finalViewUrl}>
                  <Eye className="h-3 w-3 mr-1.5" />
                  View
                </Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  title="More options"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDuplicateModalOpen(true);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
      <EditProjectModal
        project={project}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onProjectUpdated={(updatedProject) => {
          // Trigger refetch if needed
          if (onEdit) {
            onEdit(updatedProject);
          }
        }}
      />
      <DuplicateProjectModal
        project={project}
        open={duplicateModalOpen}
        onOpenChange={setDuplicateModalOpen}
        onProjectDuplicated={(duplicatedProject) => {
          // Trigger refetch if needed
          if (onDuplicate) {
            onDuplicate(duplicatedProject);
          }
        }}
      />
      <DeleteProjectDialog
        project={project}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={async () => {
          if (onDelete) {
            await onDelete(project);
          }
        }}
      />
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ProjectCard = React.memo(ProjectCardComponent);
