'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/lib/hooks/use-projects';
import { useProjectChains } from '@/lib/hooks/use-render-chain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Plus, Loader2, ArrowRight, FolderOpen, Calendar, Eye, Zap } from 'lucide-react';
import { createRenderChain } from '@/lib/actions/projects.actions';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/db/schema';

export default function ExteriorAIPage() {
  const router = useRouter();
  const { projects, loading } = useProjects();
  const [creating, setCreating] = useState<string | null>(null);

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

  const handleCreateChain = async (projectId: string) => {
    setCreating(projectId);
    try {
      const project = projects.find(p => p.id === projectId);
      const chainName = project ? `${project.name} - Exterior Chain` : 'New Exterior Chain';
      
      const result = await createRenderChain(
        projectId,
        chainName,
        'Exterior AI render chain'
      );

      if (result.success && result.data) {
        router.push(`/engine/exterior-ai/${result.data.id}`);
      } else {
        alert(result.error || 'Failed to create chain');
      }
    } catch (error) {
      console.error('Failed to create chain:', error);
      alert('Failed to create chain');
    } finally {
      setCreating(null);
    }
  };

  const handleViewProject = (projectSlug: string) => {
    router.push(`/dashboard/projects/${projectSlug}`);
  };

  const handleStartGenerating = (projectId: string) => {
    // Create a new chain and start generating
    handleCreateChain(projectId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Exterior AI Engine</h1>
          <p className="text-lg text-muted-foreground">
            Transform your exterior designs with AI-powered rendering
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Select a project to start generating exterior renders
          </p>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
                <div className="aspect-video bg-muted relative group overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground" />
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
                        onClick={() => handleViewProject(project.slug)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStartGenerating(project.id)}
                        disabled={creating === project.id}
                      >
                        {creating === project.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        {creating === project.id ? 'Creating...' : 'Generate'}
                      </Button>
                    </div>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm line-clamp-2">{project.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {project.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span>{(project as Project & { renderCount?: number }).renderCount || 0} renders</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewProject(project.slug)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleStartGenerating(project.id)}
                      disabled={creating === project.id}
                    >
                      {creating === project.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Zap className="h-3 w-3 mr-1" />
                      )}
                      {creating === project.id ? 'Creating...' : 'Start'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
              <FolderOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No projects yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first project to start generating exterior AI renders
            </p>
            <Button
              onClick={() => router.push('/dashboard/projects')}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Project</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}