'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/lib/db/schema';
import { ProjectCard } from '@/components/projects/project-card';
import { useProjects } from '@/lib/hooks/use-projects';

interface RecentProjectsPaginatedProps {
  projects: Project[];
}

const ITEMS_PER_PAGE = 5;

export function RecentProjectsPaginated({ projects }: RecentProjectsPaginatedProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { removeProject, duplicateProject, refetch } = useProjects();
  
  const totalPages = Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProjects = useMemo(
    () => projects.slice(startIndex, endIndex),
    [projects, startIndex, endIndex]
  );

  const handleDeleteProject = async (project: Project) => {
    await removeProject(project.id);
    refetch();
  };

  const handleDuplicateProject = async (project: Project) => {
    await duplicateProject(project.id);
    refetch();
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Recent Projects
          </CardTitle>
          <CardDescription>
            Your latest architectural projects
          </CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/projects">
            View All
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 h-[400px]">
        {projects.length > 0 ? (
          <>
            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
              {currentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode="list"
                  onEdit={() => refetch()}
                  onDuplicate={handleDuplicateProject}
                  onDelete={handleDeleteProject}
                />
              ))}
              {/* Placeholder items to maintain height */}
              {currentProjects.length < ITEMS_PER_PAGE && Array.from({ length: ITEMS_PER_PAGE - currentProjects.length }).map((_, i) => (
                <div key={`placeholder-${i}`} className="h-[73px] opacity-0 pointer-events-none" aria-hidden="true" />
              ))}
            </div>
            
            {/* Pagination - Always show */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t shrink-0 h-[44px]">
              <div className="text-xs text-muted-foreground">
                {projects.length > 0 ? (
                  <>Showing {startIndex + 1}-{Math.min(endIndex, projects.length)} of {projects.length}</>
                ) : (
                  <>No projects</>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {totalPages > 0 ? (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      const showEllipsis = 
                        (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2);
                      
                      if (showEllipsis) {
                        return <span key={page} className="px-1 text-muted-foreground text-xs">...</span>;
                      }
                      
                      if (!showPage) return null;
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground px-2">1</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No projects yet</p>
                <p className="text-xs">Create your first project to get started</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/projects">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              </div>
            </div>
            {/* Pagination - Always show even when empty */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t shrink-0 h-[44px]">
              <div className="text-xs text-muted-foreground">No projects</div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">1</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

