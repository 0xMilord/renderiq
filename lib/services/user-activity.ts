import { RendersDAL } from '@/lib/dal/renders';
import { ProjectsDAL } from '@/lib/dal/projects';
import { AuthDAL } from '@/lib/dal/auth';
import type { Render } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';

export interface ActivityItem {
  id: string;
  type: 'render' | 'project' | 'download' | 'share';
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'processing' | 'failed';
  thumbnail?: string;
  projectId?: string;
  projectName?: string;
}

export class UserActivityService {
  static async getUserActivity(userId: string, limit = 10): Promise<ActivityItem[]> {
    logger.log('📋 UserActivityService: Getting user activity for:', userId);
    
    try {
      // ✅ OPTIMIZED: Parallelize independent queries (2 queries → 1 parallel batch)
      const [renders, projects] = await Promise.all([
        RendersDAL.getByUser(userId, null, limit),
        ProjectsDAL.getByUserId(userId, limit, 0),
      ]);
      
      // Convert renders to activity items
      const renderActivities: ActivityItem[] = renders.map(render => ({
        id: `render-${render.id}`,
        type: 'render',
        title: this.getRenderActivityTitle(render),
        description: render.prompt,
        timestamp: render.createdAt,
        status: render.status as 'completed' | 'processing' | 'failed',
        thumbnail: render.outputUrl || undefined,
        projectId: render.projectId,
      }));

      // Convert projects to activity items
      const projectActivities: ActivityItem[] = projects.map(project => ({
        id: `project-${project.id}`,
        type: 'project',
        title: 'New Project Created',
        description: project.name,
        timestamp: project.createdAt,
        status: 'completed',
        projectId: project.id,
        projectName: project.name,
      }));

      // Combine and sort by timestamp
      const allActivities = [...renderActivities, ...projectActivities]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

      logger.log(`✅ UserActivityService: Found ${allActivities.length} activities`);
      return allActivities;
    } catch (error) {
      logger.error('❌ UserActivityService: Error getting user activity:', error);
      throw error;
    }
  }

  private static getRenderActivityTitle(render: Render): string {
    const type = render.type === 'video' ? 'Video' : 'Render';
    
    switch (render.status) {
      case 'completed':
        return `${type} Completed`;
      case 'processing':
        return `${type} Processing`;
      case 'failed':
        return `${type} Failed`;
      case 'pending':
        return `${type} Queued`;
      default:
        return `${type} Created`;
    }
  }

  static async getUserRecentProjects(userId: string, limit = 5) {
    logger.log('📁 UserActivityService: Getting recent projects for:', userId);
    
    try {
      const projects = await ProjectsDAL.getByUserIdWithRenderCounts(userId, limit, 0);
      
      if (projects.length === 0) {
        return [];
      }

      // Batch fetch: Get all latest renders for all projects in ONE query
      const projectIds = projects.map(p => p.id);
      const allLatestRenders = await ProjectsDAL.getLatestRendersForProjects(projectIds, 4);
      
      // Group renders by project
      const rendersByProject = allLatestRenders.reduce((acc, render) => {
        if (!acc[render.projectId]) {
          acc[render.projectId] = [];
        }
        acc[render.projectId].push(render);
        return acc;
      }, {} as Record<string, typeof allLatestRenders>);
      
      // Attach renders to projects
      const projectsWithRenders = projects.map(project => ({
        ...project,
        latestRenders: rendersByProject[project.id] || []
      }));

      logger.log(`✅ UserActivityService: Found ${projectsWithRenders.length} recent projects`);
      return projectsWithRenders;
    } catch (error) {
      logger.error('❌ UserActivityService: Error getting recent projects:', error);
      throw error;
    }
  }
}
