'use client';

import { useState, useEffect, useRef } from 'react';
import { getUserProjects, createProject, deleteProject, duplicateProject, getProject, getProjectBySlug, updateProject } from '@/lib/actions/projects.actions';
import type { Project } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';

// ✅ FIXED: Global cache to prevent multiple simultaneous calls to getUserProjects
// This prevents duplicate API calls when multiple components use useProjects() hook
const fetchCache: {
  [key: string]: {
    promise: Promise<Project[]>;
    timestamp: number;
    data: Project[] | null;
  };
} = {};

const CACHE_DURATION = 5000; // 5 seconds cache
const DEBOUNCE_MS = 1000; // 1 second debounce between calls

export function useProjects(platform?: 'render' | 'tools' | 'canvas') {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);
  const cacheKey = `projects-${platform || 'all'}`;

  const fetchProjects = async () => {
    try {
      // ✅ FIXED: Debounce to prevent rapid successive calls
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchRef.current;
      
      if (timeSinceLastFetch < DEBOUNCE_MS) {
        // If we recently fetched, check cache first
        const cached = fetchCache[cacheKey];
        if (cached && cached.data && (now - cached.timestamp < CACHE_DURATION)) {
          setProjects(cached.data);
          setLoading(false);
          return;
        }
        // Otherwise wait a bit before fetching
        await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS - timeSinceLastFetch));
      }

      // ✅ FIXED: Check if there's already a fetch in progress for this platform
      const cached = fetchCache[cacheKey];
      if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        // Use cached promise if still valid
        const data = await cached.promise;
        setProjects(data);
        setLoading(false);
        return;
      }

      lastFetchRef.current = Date.now();
      setLoading(true);
      setError(null);

      // Create a new fetch promise and cache it
      const fetchPromise = getUserProjects(platform).then(result => {
        if (result.success) {
          const data = result.data || [];
          // Update cache with data
          fetchCache[cacheKey] = {
            promise: Promise.resolve(data),
            timestamp: Date.now(),
            data,
          };
          return data;
        } else {
          throw new Error(result.error || 'Failed to fetch projects');
        }
      });

      // Cache the promise immediately to prevent duplicate calls
      fetchCache[cacheKey] = {
        promise: fetchPromise,
        timestamp: Date.now(),
        data: null,
      };

      const data = await fetchPromise;
      setProjects(data);
    } catch (err) {
      // Clear cache on error
      delete fetchCache[cacheKey];
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
        logger.log('✅ [useProjects] Project created, updating state incrementally...');
        // ✅ INCREMENTAL UPDATE: Add new project to state instead of refetching all
        const newProject = result.data as Project;
        // ✅ FILTER: Only add if platform matches (or if no platform filter is set)
        if (!platform || newProject.platform === platform) {
          setProjects(prev => [newProject, ...prev]);
        }
        return { success: true, data: result.data };
      } else {
        // ✅ FIXED: Pass through limitReached data from action
        const limitData = (result as any).limitReached ? {
          limitReached: (result as any).limitReached,
          limitType: (result as any).limitType,
          current: (result as any).current,
          limit: (result as any).limit,
          planName: (result as any).planName,
        } : undefined;
        
        console.error('❌ [useProjects] Project creation failed:', result.error);
        setError(result.error || 'Failed to create project');
        return { 
          success: false, 
          error: result.error,
          ...limitData, // Spread limit data if present
        };
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


  // ✅ FIXED: Only fetch on mount and when platform changes
  // fetchProjects is stable (doesn't change), so we don't need it in deps
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

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
