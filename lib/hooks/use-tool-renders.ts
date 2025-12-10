import { useMemo } from 'react';
import { useToolExecutions } from './use-tools';
import { ToolConfig } from '@/lib/tools/registry';

/**
 * ✅ UPDATED: Fetch tool renders from tool_executions instead of filtering renders
 * This uses the new dedicated infrastructure for tools
 */
export function useToolRenders(tool: ToolConfig, projectId: string | null, includeProcessing = false) {
  const { executions, loading, refetch } = useToolExecutions(
    projectId || undefined,
    tool.id,
    20
  );
  
  // Extract renders from tool executions
  const toolRenders = useMemo(() => {
    return executions
      .filter(execution => {
        // Show completed executions with output, or processing/pending if includeProcessing is true
        if (includeProcessing) {
          return execution.status === 'completed' || execution.status === 'processing' || execution.status === 'pending';
        }
        return execution.status === 'completed' && (execution.outputUrl || execution.outputRenderId);
      })
      .map(execution => ({
        id: execution.outputRenderId || execution.id, // Use render ID if available, otherwise execution ID
        renderId: execution.outputRenderId || execution.id,
        outputUrl: execution.outputUrl || undefined,
        status: execution.status,
        createdAt: execution.createdAt,
        // Include execution metadata
        executionId: execution.id,
        toolId: execution.toolId,
      }))
      .slice(0, 20); // Limit to 20 most recent
  }, [executions, includeProcessing]);

  return {
    toolRenders,
    loading,
    refetch,
  };
}

