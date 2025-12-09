'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CanvasFile } from '@/lib/db/schema';

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

      const params = new URLSearchParams();
      if (options.projectId) params.append('projectId', options.projectId);
      if (options.userId) params.append('userId', options.userId);
      if (options.includeArchived) params.append('includeArchived', 'true');

      const response = await fetch(`/api/canvas/files?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch canvas files');
      }

      const data = await response.json();
      setFiles(data.files || []);
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

        const response = await fetch(`/api/canvas/files/${projectId}/${slug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch canvas file');
        }

        const data = await response.json();
        setFile(data.file || null);
        setGraph(data.graph || null);
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

