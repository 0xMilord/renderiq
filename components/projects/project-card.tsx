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
  Video
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

interface LatestRender {
  id: string;
  outputUrl: string | null;
  status: string;
  type: 'image' | 'video';
  createdAt: Date;
}

interface ProjectCardProps {
  project: Project & { 
    renderCount?: number;
    latestRenders?: LatestRender[];
  };
  viewMode: 'default' | 'compact' | 'list';
  onEdit?: (project: Project) => void;
  onDuplicate?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

function ProjectCardComponent({ 
  project, 
  viewMode, 
  onEdit, 
  onDuplicate, 
  onDelete 
}: ProjectCardProps) {
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

  const renderImageGrid = () => {
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

  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 flex-shrink-0">
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
              <h3 className="font-medium text-sm truncate">{toSentenceCase(project.name)}</h3>
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
            <div className="flex items-center space-x-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                asChild
                title="View"
              >
                <Link href={`/dashboard/projects/${project.slug}`}>
                  <Eye className="h-3 w-3" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setEditModalOpen(true)}
                title="Edit"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setDuplicateModalOpen(true)}
                title="Duplicate"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => setDeleteDialogOpen(true)}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
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
    )}>
      <div className={cn(
        "bg-muted relative group flex-shrink-0 rounded-t-lg overflow-hidden",
        viewMode === 'compact' ? "aspect-square" : "aspect-video"
      )}>
        <div className="w-full h-full p-1">
          {renderImageGrid()}
        </div>
        {project.status !== 'processing' && (
          <div className="absolute top-2 right-2">
            <Badge className={cn("text-xs", getStatusColor(project.status))}>
              {project.status}
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              asChild
            >
              <Link href={`/dashboard/projects/${project.slug}`}>
                <Eye className="h-3 w-3 mr-1.5" />
                View
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <CardHeader className="pb-2 flex-shrink-0 gap-0 px-6 pt-6">
        <CardTitle className={cn(
          "text-sm",
          viewMode === 'compact' ? "line-clamp-1" : "line-clamp-2"
        )}>{toSentenceCase(project.name)}</CardTitle>
        <CardDescription className={cn(
          "text-xs",
          viewMode === 'compact' ? "line-clamp-1" : "line-clamp-2"
        )}>
          {project.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <div className="px-6">
        <div className="border-t border-border"></div>
      </div>
      <CardContent className="pt-4 flex-shrink-0 px-6 pb-6">
        <div className="grid grid-cols-20 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="col-span-11"
            asChild
          >
            <Link href={`/dashboard/projects/${project.slug}`}>
              <Eye className="h-3 w-3 mr-1.5" />
              View
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="col-span-3"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="col-span-3"
            onClick={() => setDuplicateModalOpen(true)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="col-span-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
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
