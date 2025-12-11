import { AuthDAL } from '@/lib/dal/auth';
import { ProjectsDAL } from '@/lib/dal/projects';
import { RendersDAL } from '@/lib/dal/renders';
import { logger } from '@/lib/utils/logger';
import { db } from '@/lib/db';
import { renders, projects } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

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
    logger.log('📊 ProfileStatsService: Getting user stats for:', userId);
    
    try {
      // ✅ OPTIMIZED: Parallelize independent queries
      const [user, projectsData, credits, rendersData, renderCountResult, projectCountResult] = await Promise.all([
        AuthDAL.getUserById(userId),
        ProjectsDAL.getByUserId(userId, 1000, 0),
        AuthDAL.getUserCredits(userId),
        RendersDAL.getByUser(userId, null, 100),
        // ✅ FIXED: Count total renders directly from renders table (not from project counts)
        db.select({
          total: sql<number>`COUNT(*)::int`,
        })
          .from(renders)
          .where(eq(renders.userId, userId)),
        // ✅ FIXED: Count total projects directly
        db.select({
          total: sql<number>`COUNT(*)::int`,
        })
          .from(projects)
          .where(eq(projects.userId, userId))
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      // ✅ FIXED: Get counts directly from SQL queries (ensures proper number types)
      const totalProjects = Number(projectCountResult[0]?.total || 0);
      const totalRenders = Number(renderCountResult[0]?.total || 0);

      // ✅ FIXED: Extract credits info with proper number conversion
      const creditsUsed = Number(credits?.totalSpent || 0);
      const creditsRemaining = Number(credits?.balance || 0);

      // ✅ FIXED: Process renders for stats (use rendersData from query)
      const completedRenders = rendersData.filter(render => render.status === 'completed' && render.processingTime);
      
      const averageRenderTime = completedRenders.length > 0 
        ? Math.round(completedRenders.reduce((sum, render) => sum + Number(render.processingTime || 0), 0) / completedRenders.length)
        : 0;

      // ✅ FIXED: Calculate favorite style from render settings
      const styleCounts = new Map<string, number>();
      rendersData.forEach(render => {
        if (render.settings && typeof render.settings === 'object') {
          const settings = render.settings as Record<string, unknown>;
          const style = (settings.style as string) || (settings.architecturalStyle as string) || 'Modern';
          styleCounts.set(style, (styleCounts.get(style) || 0) + 1);
        }
      });
      
      const favoriteStyle = styleCounts.size > 0 
        ? Array.from(styleCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : 'Modern';

      // ✅ FIXED: Get last activity (most recent render or project)
      const lastRender = rendersData.length > 0 ? rendersData[0].createdAt : null;
      const lastProject = projectsData.length > 0 ? projectsData[0].createdAt : null;
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

      logger.log('✅ ProfileStatsService: Stats calculated:', stats);
      return stats;
    } catch (error) {
      logger.error('❌ ProfileStatsService: Error getting user stats:', error);
      throw error;
    }
  }
}
