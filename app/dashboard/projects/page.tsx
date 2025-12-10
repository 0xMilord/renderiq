'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FolderOpen, Search, RefreshCw } from 'lucide-react';
import { CreateProjectModal } from '@/components/projects/create-project-modal';
import { ViewModeToggle } from '@/components/projects/view-mode-toggle';
import { ProjectCard } from '@/components/projects/project-card';
import { useProjects } from '@/lib/hooks/use-projects';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/db/schema';
import { useUIPreferencesStore } from '@/lib/stores/ui-preferences-store';
import { useSearchFilterStore } from '@/lib/stores/search-filter-store';

export default function ProjectsPage() {
  // Fetch ALL projects (no platform filter for dashboard)
  const { projects, loading, error, removeProject, duplicateProject, refetch } = useProjects();
  
  // ✅ MIGRATED: Using Zustand stores for state management
  const { viewMode, setViewMode } = useUIPreferencesStore();
  const { renderSearchQuery, renderSortBy, renderFilterStatus, setRenderFilters } = useSearchFilterStore();
  
  // Use store values with local aliases for backward compatibility
  const searchQuery = renderSearchQuery;
  const sortBy = renderSortBy;
  const filterStatus = renderFilterStatus;
  const setSearchQuery = (query: string) => setRenderFilters(query, sortBy, filterStatus);
  const setSortBy = (newSortBy: string) => setRenderFilters(searchQuery, newSortBy, filterStatus);
  const setFilterStatus = (newStatus: string) => setRenderFilters(searchQuery, sortBy, newStatus);

  // Memoize filtered projects to avoid recalculating on every render
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, filterStatus]);

  // Memoize sorted projects to avoid recalculating on every render
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [filteredProjects, sortBy]);

  // Memoize grid columns calculation
  const gridCols = useMemo(() => {
    switch (viewMode) {
      case 'compact':
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
      case 'list':
        return 'grid-cols-1';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  }, [viewMode]);

  // Memoize event handlers with useCallback
  const handleDeleteProject = useCallback(async (project: Project) => {
    const result = await removeProject(project.id);
    if (!result.success) {
      alert(result.error || 'Failed to delete project');
    }
  }, [removeProject]);

  const handleDuplicateProject = useCallback(async (project: Project) => {
    // The modal handles the duplication, we just need to refetch
    refetch();
  }, [refetch]);

  const handleEditProject = useCallback(async () => {
    // This would open an edit modal or navigate to edit page
    // For now, just show an alert
    alert('Edit functionality coming soon!');
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
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

  if (error) {
    return (
      <div className="h-full w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">Error loading projects</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            {error.includes('Authentication') && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Please try refreshing the page or signing in again.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  size="sm"
                >
                  Refresh Page
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        </div>

        {/* Projects Grid */}
        {sortedProjects.length > 0 ? (
          <div className={cn("grid gap-4", gridCols)}>
            {sortedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewMode={viewMode}
                onEdit={() => refetch()}
                onDuplicate={handleDuplicateProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'Create your first AI-generated project'
              }
            </p>
            {!searchQuery && (
              <CreateProjectModal onProjectCreated={() => refetch()}>
                <Button>Get Started</Button>
              </CreateProjectModal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}