'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Tool, ToolExecution } from '@/lib/db/schema';
import { getToolsAction, getToolBySlugAction, getToolExecutionsAction } from '@/lib/actions/tools.actions';

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

      const result = await getToolsAction({
        category: options.category,
        outputType: options.outputType,
        includeInactive: options.includeInactive,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tools');
      }

      setTools(result.tools || []);
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
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await getToolBySlugAction(slug);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch tool');
        }

        setTool(result.tool || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tool');
      } finally {
        setLoading(false);
      }
    }

    fetchTool();
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

      const result = await getToolExecutionsAction({
        projectId,
        toolId,
        limit,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch tool executions');
      }

      setExecutions(result.executions || []);
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

