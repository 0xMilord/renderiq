'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { ProjectCard } from '@/components/projects/project-card';
import { useRecentProjects } from '@/lib/hooks/use-recent-projects';

export function RecentProjectsSection() {
  const { projects, loading, error } = useRecentProjects();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your latest architectural projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your latest architectural projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-destructive text-sm">Failed to load projects: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
        <CardDescription>Your latest architectural projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Button asChild>
                <Link href="/dashboard/projects">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {projects.slice(0, 2).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode="list"
                />
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/projects">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Projects
                </Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
