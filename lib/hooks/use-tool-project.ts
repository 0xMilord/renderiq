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

    // Look for existing "Tools" project
    const toolsProject = projects.find(
      p => p.name.toLowerCase() === 'tools' || p.name.toLowerCase() === 'micro tools'
    );

    if (toolsProject) {
      setToolProjectId(toolsProject.id);
      logger.log('✅ Found existing Tools project:', toolsProject.id);
      return;
    }

    // Create "Tools" project if it doesn't exist
    if (!creating && projects.length > 0) {
      setCreating(true);
      const formData = new FormData();
      formData.append('projectName', 'Tools');
      formData.append('description', 'Default project for micro-tools and specialized AI tools');
      
      createProject(formData)
        .then(result => {
          if (result.success && result.data) {
            setToolProjectId(result.data.id);
            logger.log('✅ Created Tools project:', result.data.id);
          } else {
            logger.error('❌ Failed to create Tools project:', result.error);
            // Fallback to first project if creation fails
            if (projects.length > 0) {
              setToolProjectId(projects[0].id);
            }
          }
        })
        .catch(error => {
          logger.error('❌ Error creating Tools project:', error);
          // Fallback to first project
          if (projects.length > 0) {
            setToolProjectId(projects[0].id);
          }
        })
        .finally(() => {
          setCreating(false);
        });
    } else if (projects.length > 0) {
      // Fallback to first project
      setToolProjectId(projects[0].id);
    }
  }, [projects, loading, creating]);

  return {
    projectId: toolProjectId,
    loading: loading || creating,
  };
}

