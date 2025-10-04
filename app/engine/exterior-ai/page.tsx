'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/lib/hooks/use-projects';
import { useProjectChains } from '@/lib/hooks/use-render-chain';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, FolderOpen, Zap } from 'lucide-react';
import { createRenderChain } from '@/lib/actions/projects.actions';
import { ProjectCard } from '@/components/projects/project-card';
import type { Project } from '@/lib/db/schema';

export default function ExteriorAIPage() {
  const router = useRouter();
  const { projects, loading } = useProjects();
  const [creating, setCreating] = useState<string | null>(null);


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
              <ProjectCard
                key={project.id}
                project={project}
                viewMode="default"
                onEdit={() => {
                  // Navigate to project edit (if implemented)
                  console.log('Edit project:', project.id);
                }}
                onDuplicate={() => {
                  // Duplicate project functionality
                  console.log('Duplicate project:', project.id);
                }}
                onDelete={() => {
                  // Delete project functionality
                  console.log('Delete project:', project.id);
                }}
              />
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