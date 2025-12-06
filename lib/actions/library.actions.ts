'use server';

import { createClient } from '@/lib/supabase/server';
import { RendersDAL } from '@/lib/dal/renders';
import { ProjectsDAL } from '@/lib/dal/projects';
import { logger } from '@/lib/utils/logger';
import type { Render } from '@/lib/types/render';
import type { Project } from '@/lib/db/schema';

export interface RendersByProject {
  project: Project;
  renders: Render[];
}

export async function getUserRendersByProject() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return { success: false, error: 'Failed to initialize database connection' };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.error('Auth error in getUserRendersByProject:', authError);
      return { success: false, error: 'Authentication failed' };
    }

    // Fetch all user projects
    const projects = await ProjectsDAL.getByUserId(user.id);
    
    // Fetch all renders for the user
    const allRenders = await RendersDAL.getByUser(user.id);
    
    // Group renders by project
    const rendersByProject: RendersByProject[] = projects.map(project => {
      const projectRenders = allRenders
        .filter(render => render.projectId === project.id)
        .map(render => ({
          ...render,
          createdAt: render.createdAt instanceof Date ? render.createdAt : new Date(render.createdAt),
          updatedAt: render.updatedAt instanceof Date ? render.updatedAt : new Date(render.updatedAt),
        } as Render));
      
      return {
        project,
        renders: projectRenders.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        ),
      };
    }).filter(item => item.renders.length > 0); // Only include projects with renders
    
    // Sort projects by most recent render
    rendersByProject.sort((a, b) => {
      const aLatest = a.renders[0]?.createdAt.getTime() || 0;
      const bLatest = b.renders[0]?.createdAt.getTime() || 0;
      return bLatest - aLatest;
    });

    return { success: true, data: rendersByProject };
  } catch (error) {
    logger.error('Error in getUserRendersByProject:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get renders by project',
    };
  }
}

