'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Project } from '@/lib/db/schema';
import { FolderOpen, Image as ImageIcon } from 'lucide-react';

interface ProjectCardMicroProps {
  project: Project & { 
    renderCount?: number;
  };
}

export function ProjectCardMicro({ project }: ProjectCardMicroProps) {
  const getPlatformBadge = () => {
    if (project.platform === 'tools') {
      return { label: 'Tools', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' };
    }
    if (project.platform === 'canvas') {
      return { label: 'Canvas', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' };
    }
    return { label: 'Render', color: 'bg-primary/10 text-primary' };
  };

  const platformBadge = getPlatformBadge();
  const toSentenceCase = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return (
    <Link 
      href={`/dashboard/projects/${project.slug}`}
      className="block"
    >
      <div className="group flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-md bg-muted flex items-center justify-center">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
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

