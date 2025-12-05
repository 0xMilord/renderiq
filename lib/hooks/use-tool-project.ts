'use client';

import { useState, useEffect } from 'react';
import { useProjects } from './use-projects';
import { createProject } from '@/lib/actions/projects.actions';
import { logger } from '@/lib/utils/logger';

/**
 * Hook to get or create a default "Tools" project for micro-tools
 * This ensures all tool-generated renders are organized in one place
 */
export function useToolProject() {
  const { projects, loading } = useProjects();
  const [toolProjectId, setToolProjectId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Look for existing "Tools" project (but don't auto-create)
    const toolsProject = projects.find(
      p => p.name.toLowerCase() === 'tools' || p.name.toLowerCase() === 'micro tools'
    );

    if (toolsProject) {
      setToolProjectId(toolsProject.id);
      logger.log('✅ Found existing Tools project:', toolsProject.id);
      return;
    }

    // Don't auto-create projects - user must select manually
    // Return null to indicate no project is selected
    setToolProjectId(null);
  }, [projects, loading]);

  return {
    projectId: toolProjectId,
    loading: loading || creating,
  };
}

