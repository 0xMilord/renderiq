'use client';

import { useState, useEffect } from 'react';
import { getUserProjects, createProject, deleteProject, duplicateProject, getProject, getProjectBySlug, updateProject } from '@/lib/actions/projects.actions';
import type { Project } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUserProjects();
      
      if (result.success) {
        setProjects(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (formData: FormData) => {
    try {
      logger.log('🚀 [useProjects] addProject called');
      setError(null);
      
      logger.log('📞 [useProjects] Calling createProject action...');
      const result = await createProject(formData);
      logger.log('📊 [useProjects] createProject result:', result);
      
      if (result.success && 'data' in result && result.data) {
        logger.log('✅ [useProjects] Project created, refetching projects...');
        // Refetch to get the latest projects list including the new one
        await fetchProjects();
        return { success: true, data: result.data };
      } else {
        console.error('❌ [useProjects] Project creation failed:', result.error);
        setError(result.error || 'Failed to create project');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('❌ [useProjects] Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const removeProject = async (projectId: string) => {
    try {
      setError(null);
      const result = await deleteProject(projectId);
      
      if (result.success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        return { success: true };
      } else {
        setError(result.error || 'Failed to delete project');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const duplicateProjectAction = async (projectId: string, newName?: string) => {
    try {
      setError(null);
      const result = await duplicateProject(projectId, newName);
      
      if (result.success && 'data' in result && result.data) {
        setProjects(prev => [result.data, ...prev]);
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to duplicate project');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateProjectAction = async (projectId: string, updateData: {
    name?: string;
    description?: string | null;
    isPublic?: boolean;
    tags?: string[] | null;
  }) => {
    try {
      setError(null);
      const result = await updateProject(projectId, updateData);
      
      if (result.success && 'data' in result && result.data) {
        // Update the project in the local state
        setProjects(prev => prev.map(p => p.id === projectId ? result.data : p));
        return { success: true, data: result.data };
      } else {
        setError(result.error || 'Failed to update project');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };


  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    addProject,
    removeProject,
    duplicateProject: duplicateProjectAction,
    updateProject: updateProjectAction,
    refetch: fetchProjects,
  };
}

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async (id: string) => {
    if (!id) {
      setProject(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getProject(id);
      
      if (result.success) {
        setProject(result.data || null);
      } else {
        setError(result.error || 'Failed to fetch project');
        setProject(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject(projectId || '');
  }, [projectId]);

  return {
    project,
    loading,
    error,
    refetch: () => fetchProject(projectId || ''),
  };
}

export function useProjectBySlug(slug: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = async (projectSlug: string) => {
    if (!projectSlug) {
      setProject(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getProjectBySlug(projectSlug);
      
      if (result.success) {
        setProject(result.data || null);
      } else {
        setError(result.error || 'Failed to fetch project');
        setProject(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject(slug || '');
  }, [slug]);

  return {
    project,
    loading,
    error,
    refetch: () => fetchProject(slug || ''),
  };
}
