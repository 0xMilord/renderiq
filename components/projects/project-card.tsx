'use client';

import React from 'react';
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

  const renderImageGrid = () => {
    if (latestRenders.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-muted rounded">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      );
    }

    const remainingCount = project.renderCount ? project.renderCount - 3 : 0;

    return (
      <div className="grid grid-cols-2 gap-1 h-full">
        {latestRenders.slice(0, 3).map((render, index) => (
          <div key={render.id} className="relative bg-muted rounded overflow-hidden aspect-square">
            {render.outputUrl ? (
              <img
                src={render.outputUrl}
                alt={`Render ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {render.type === 'video' ? (
                  <Video className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* 4th tile with overflow indicator */}
        <div className="relative bg-muted rounded overflow-hidden aspect-square">
          {latestRenders[3]?.outputUrl ? (
            <>
              <img
                src={latestRenders[3].outputUrl}
                alt="Render 4"
                className="w-full h-full object-cover"
              />
              {remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </>
          ) : remainingCount > 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-black/20">
              <span className="text-muted-foreground text-sm font-medium">
                +{remainingCount}
              </span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <div className="w-full h-full bg-muted rounded-lg overflow-hidden">
                {renderImageGrid()}
              </div>
              <div className="absolute -top-1 -right-1">
                <Badge className={cn("text-xs", getStatusColor(project.status))}>
                  {project.status}
                </Badge>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{project.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {project.description || 'No description'}
              </p>
              <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                <span>{project.renderCount || 0} renders</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <Link href={`/dashboard/projects/${project.slug}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/projects/${project.slug}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(project)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate?.(project)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => onDelete?.(project)}
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
    <Card className="group hover:shadow-lg transition-all duration-200 h-full flex flex-col">
      <div className="aspect-video bg-muted relative group flex-shrink-0">
        <div className="w-full h-full p-1">
          {renderImageGrid()}
        </div>
        <div className="absolute top-2 right-2">
          <Badge className={cn("text-xs", getStatusColor(project.status))}>
            {project.status}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              asChild
            >
              <Link href={`/dashboard/projects/${project.slug}`}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm line-clamp-2">{project.name}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">
          {project.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(project.createdAt)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>{project.renderCount || 0} renders</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/projects/${project.slug}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(project)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate?.(project)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => onDelete?.(project)}
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

// Memoize component to prevent unnecessary re-renders
export const ProjectCard = React.memo(ProjectCardComponent);
