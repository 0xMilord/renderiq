import { useMemo } from 'react';
import { useRenders } from './use-renders';
import { ToolConfig } from '@/lib/tools/registry';

export function useToolRenders(tool: ToolConfig, projectId: string | null) {
  const { renders, loading, refetch } = useRenders(projectId);
  
  const toolRenders = useMemo(() => {
    return renders
      .filter(render => {
        // Check if render was created with this tool via settings.imageType
        if (render.settings && typeof render.settings === 'object' && 'imageType' in render.settings) {
          return (render.settings as { imageType?: string }).imageType === tool.id;
        }
        return false;
      })
      .filter(render => render.status === 'completed' && render.outputUrl)
      .slice(0, 20); // Limit to 20 most recent
  }, [renders, tool.id]);

  return {
    toolRenders,
    loading,
    refetch,
  };
}

