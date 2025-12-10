'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CanvasFile } from '@/lib/db/schema';
import { 
  getCanvasFilesAction, 
  getCanvasFileBySlugAction,
  createCanvasFileAction,
  updateCanvasFileAction,
  deleteCanvasFileAction,
  duplicateCanvasFileAction
} from '@/lib/actions/canvas-files.actions';
import { toast } from 'sonner';

interface UseCanvasFilesOptions {
  projectId?: string;
  userId?: string;
  includeArchived?: boolean;
}

export function useCanvasFiles(options: UseCanvasFilesOptions = {}) {
  const [files, setFiles] = useState<CanvasFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!options.projectId && !options.userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getCanvasFilesAction({
        projectId: options.projectId,
        userId: options.userId,
        includeArchived: options.includeArchived,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch canvas files');
      }

      setFiles(result.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch canvas files');
    } finally {
      setLoading(false);
    }
  }, [options.projectId, options.userId, options.includeArchived]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    loading,
    error,
    refetch: fetchFiles,
  };
}

export function useCanvasFile(projectId?: string, slug?: string) {
  const [file, setFile] = useState<CanvasFile | null>(null);
  const [graph, setGraph] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFile() {
      if (!projectId || !slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await getCanvasFileBySlugAction(projectId, slug);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch canvas file');
        }

        setFile(result.file || null);
        setGraph(result.graph || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch canvas file');
      } finally {
        setLoading(false);
      }
    }

    fetchFile();
  }, [projectId, slug]);

  return {
    file,
    graph,
    loading,
    error,
  };
}

/**
 * ✅ NEW: Hook for canvas file CRUD operations
 */
export function useCanvasFileOperations() {
  const [loading, setLoading] = useState(false);

  const createFile = useCallback(async (data: {
    projectId: string;
    name: string;
    slug: string;
    description?: string;
  }) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('projectId', data.projectId);
      formData.append('name', data.name);
      formData.append('slug', data.slug);
      if (data.description) {
        formData.append('description', data.description);
      }

      const result = await createCanvasFileAction(formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create canvas file');
      }

      toast.success('Canvas file created successfully');
      return { success: true, data: result.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create canvas file';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFile = useCallback(async (fileId: string, data: {
    name?: string;
    slug?: string;
    description?: string;
  }) => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.slug) formData.append('slug', data.slug);
      if (data.description !== undefined) {
        formData.append('description', data.description || '');
      }

      const result = await updateCanvasFileAction(fileId, formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update canvas file');
      }

      toast.success('Canvas file updated successfully');
      return { success: true, data: result.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update canvas file';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    setLoading(true);
    try {
      const result = await deleteCanvasFileAction(fileId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete canvas file');
      }

      toast.success('Canvas file deleted successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete canvas file';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const duplicateFile = useCallback(async (fileId: string, newName?: string) => {
    setLoading(true);
    try {
      const result = await duplicateCanvasFileAction(fileId, newName);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to duplicate canvas file');
      }

      toast.success('Canvas file duplicated successfully');
      return { success: true, data: result.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate canvas file';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createFile,
    updateFile,
    deleteFile,
    duplicateFile,
    loading,
  };
}

