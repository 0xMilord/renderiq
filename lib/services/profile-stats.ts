import { AuthDAL } from '@/lib/dal/auth';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';

export interface ProfileStats {
  totalProjects: number;
  totalRenders: number;
  creditsUsed: number;
  creditsRemaining: number;
  averageRenderTime: number;
  favoriteStyle: string;
  lastActivity: Date | null;
  joinDate: Date;
}

export class ProfileStatsService {
  static async getUserStats(userId: string): Promise<ProfileStats> {
    console.log('📊 ProfileStatsService: Getting user stats for:', userId);
    
    try {
      // ✅ OPTIMIZED: Parallelize independent queries
      const [user, projects, credits, renders] = await Promise.all([
        AuthDAL.getUserById(userId),
        ProjectsDAL.getByUserIdWithRenderCounts(userId, 1000, 0),
        AuthDAL.getUserCredits(userId),
        RendersDAL.getByUser(userId, null, 100)
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate from projects (already includes render counts)
      const totalProjects = projects.length;
      const totalRenders = projects.reduce((sum, project) => sum + (project.renderCount || 0), 0);

      // Extract credits info
      const creditsUsed = credits?.totalSpent || 0;
      const creditsRemaining = credits?.balance || 0;

      // Process renders for stats
      const completedRenders = renders.filter(render => render.status === 'completed' && render.processingTime);
      
      const averageRenderTime = completedRenders.length > 0 
        ? Math.round(completedRenders.reduce((sum, render) => sum + (render.processingTime || 0), 0) / completedRenders.length)
        : 0;

      // Calculate favorite style from render prompts
      const styleCounts = new Map<string, number>();
      renders.forEach(render => {
        if (render.settings && typeof render.settings === 'object') {
          const settings = render.settings as Record<string, unknown>;
          const style = (settings.style as string) || (settings.architecturalStyle as string) || 'Modern';
          styleCounts.set(style, (styleCounts.get(style) || 0) + 1);
        }
      });
      
      const favoriteStyle = styleCounts.size > 0 
        ? Array.from(styleCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : 'Modern';

      // Get last activity (most recent render or project)
      const lastRender = renders.length > 0 ? renders[0].createdAt : null;
      const lastProject = projects.length > 0 ? projects[0].createdAt : null;
      const lastActivity = lastRender && lastProject 
        ? (lastRender > lastProject ? lastRender : lastProject)
        : lastRender || lastProject;

      const stats: ProfileStats = {
        totalProjects,
        totalRenders,
        creditsUsed,
        creditsRemaining,
        averageRenderTime,
        favoriteStyle,
        lastActivity,
        joinDate: user.createdAt,
      };

      console.log('✅ ProfileStatsService: Stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ ProfileStatsService: Error getting user stats:', error);
      throw error;
    }
  }
}
