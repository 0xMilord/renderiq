'use client';

import { useState, useEffect } from 'react';
import { getUserProjects, createProject, deleteProject } from '@/lib/actions/projects.actions';
import type { Project } from '@/lib/db/schema';

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
      setError(null);
      const result = await createProject(formData);
      
      if (result.success && result.data) {
        setProjects(prev => [result.data!, ...prev]);
        return { success: true };
      } else {
        setError(result.error || 'Failed to create project');
        return { success: false, error: result.error };
      }
    } catch (err) {
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

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    addProject,
    removeProject,
    refetch: fetchProjects,
  };
}
