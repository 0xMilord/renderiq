'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Image as ImageIcon, 
  Video, 
  Calendar,
  Eye,
  Download,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RendersByProject } from '@/lib/actions/library.actions';
import type { Render } from '@/lib/types/render';

interface LibraryClientProps {
  rendersByProject: RendersByProject[];
}

export function LibraryClient({ rendersByProject }: LibraryClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(rendersByProject.map(item => item.project.id))
  );

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const filteredProjects = selectedProjectId
    ? rendersByProject.filter(item => item.project.id === selectedProjectId)
    : rendersByProject;

  const totalRenders = rendersByProject.reduce((sum, item) => sum + item.renders.length, 0);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (render: Render) => {
    if (!render.outputUrl) return;
    try {
      const response = await fetch(render.outputUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `render-${render.id}.${render.type === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Library</h1>
        <p className="text-muted-foreground">
          All your renders organized by project ({totalRenders} total renders)
        </p>
      </div>

      {/* Projects List */}
      {rendersByProject.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No renders yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating renders to see them here organized by project.
            </p>
            <Button asChild>
              <Link href="/render">
                Create Your First Render
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredProjects.map(({ project, renders }) => {
            const isExpanded = expandedProjects.has(project.id);
            
            return (
              <Card key={project.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Project Header */}
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <h2 className="font-semibold text-lg truncate">{project.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {renders.length} {renders.length === 1 ? 'render' : 'renders'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/projects/${project.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-primary hover:underline"
                      >
                        View Project
                      </Link>
                      <div className={cn(
                        "transition-transform duration-200",
                        isExpanded && "rotate-90"
                      )}>
                        →
                      </div>
                    </div>
                  </button>

                  {/* Renders Grid */}
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                        {renders.map((render) => {
                          const isVideo = render.type === 'video';
                          const chainPath = render.chainId 
                            ? `/project/${project.slug}/chain/${render.chainId}`
                            : `/dashboard/projects/${project.slug}`;
                          
                          return (
                            <Card key={render.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                              <CardContent className="p-0">
                                {/* Render Image/Video */}
                                <Link href={chainPath}>
                                  <div className="relative aspect-square bg-muted overflow-hidden">
                                    {render.outputUrl ? (
                                      isVideo ? (
                                        <video
                                          src={render.outputUrl}
                                          className="w-full h-full object-cover"
                                          muted
                                          playsInline
                                        />
                                      ) : (
                                        <Image
                                          src={render.outputUrl}
                                          alt={render.prompt || 'Render'}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                          unoptimized
                                        />
                                      )
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        {isVideo ? (
                                          <Video className="h-12 w-12 text-muted-foreground" />
                                        ) : (
                                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Status Badge */}
                                    {render.status !== 'completed' && (
                                      <div className="absolute top-2 right-2">
                                        <Badge 
                                          variant={render.status === 'failed' ? 'destructive' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {render.status}
                                        </Badge>
                                      </div>
                                    )}

                                    {/* Type Indicator */}
                                    <div className="absolute top-2 left-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {isVideo ? <Video className="h-3 w-3 mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                                        {isVideo ? 'Video' : 'Image'}
                                      </Badge>
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDownload(render);
                                          }}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          asChild
                                        >
                                          <Link href={chainPath}>
                                            <Eye className="h-4 w-4" />
                                          </Link>
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </Link>

                                {/* Render Info */}
                                <div className="p-3 space-y-2">
                                  <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                                    {render.prompt || 'Untitled render'}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(render.createdAt)}
                                    </div>
                                  </div>
                                  {render.chainPosition !== null && (
                                    <div className="text-xs text-muted-foreground">
                                      Version {render.chainPosition + 1}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

