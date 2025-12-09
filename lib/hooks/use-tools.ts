'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Tool, ToolExecution } from '@/lib/db/schema';

interface UseToolsOptions {
  category?: 'transformation' | 'floorplan' | 'diagram' | 'material' | 'interior' | '3d' | 'presentation' | 'video';
  outputType?: 'image' | 'video' | '3d' | 'audio' | 'doc';
  includeInactive?: boolean;
}

export function useTools(options: UseToolsOptions = {}) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.outputType) params.append('outputType', options.outputType);
      if (options.includeInactive) params.append('includeInactive', 'true');

      const response = await fetch(`/api/tools?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }

      const data = await response.json();
      setTools(data.tools || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tools');
    } finally {
      setLoading(false);
    }
  }, [options.category, options.outputType, options.includeInactive]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  return {
    tools,
    loading,
    error,
    refetch: fetchTools,
  };
}

export function useTool(slug: string) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTool() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/tools/${slug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tool');
        }

        const data = await response.json();
        setTool(data.tool || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tool');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchTool();
    }
  }, [slug]);

  return {
    tool,
    loading,
    error,
  };
}

export function useToolExecutions(projectId?: string, toolId?: string, limit?: number) {
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExecutions = useCallback(async () => {
    if (!projectId && !toolId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (toolId) params.append('toolId', toolId);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/tools/executions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tool executions');
      }

      const data = await response.json();
      setExecutions(data.executions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tool executions');
    } finally {
      setLoading(false);
    }
  }, [projectId, toolId, limit]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  return {
    executions,
    loading,
    error,
    refetch: fetchExecutions,
  };
}

