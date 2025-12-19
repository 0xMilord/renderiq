'use server';

import { getCachedUser } from '@/lib/services/auth-cache';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { logger } from '@/lib/utils/logger';

export interface GetAnalyticsOptions {
  days?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface AnalyticsData {
  renderStats: Awaited<ReturnType<typeof AnalyticsService.getRenderStats>>;
  creditStats: Awaited<ReturnType<typeof AnalyticsService.getCreditStats>>;
  apiUsageStats: Awaited<ReturnType<typeof AnalyticsService.getApiUsageStats>>;
  userActivityStats: Awaited<ReturnType<typeof AnalyticsService.getUserActivityStats>>;
  storageStats: Awaited<ReturnType<typeof AnalyticsService.getStorageStats>>;
  projectsStats: Awaited<ReturnType<typeof AnalyticsService.getProjectsStats>>;
  dailyUsage: Awaited<ReturnType<typeof AnalyticsService.getDailyUsage>>;
}

/**
 * Get comprehensive analytics data for the current user
 */
export async function getAnalyticsData(options: GetAnalyticsOptions = {}): Promise<{
  success: boolean;
  data?: AnalyticsData;
  error?: string;
}> {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    logger.log('📊 Analytics Action: Fetching analytics data', {
      userId: user.id,
      options
    });

    const { days = 30, startDate, endDate } = options;

    const timeRange = startDate && endDate
      ? { startDate, endDate }
      : undefined;

    // Fetch all analytics data in parallel
    const [
      renderStats,
      creditStats,
      apiUsageStats,
      userActivityStats,
      storageStats,
      projectsStats,
      dailyUsage,
    ] = await Promise.all([
      AnalyticsService.getRenderStats(user.id, timeRange),
      AnalyticsService.getCreditStats(user.id, timeRange),
      AnalyticsService.getApiUsageStats(user.id, timeRange),
      AnalyticsService.getUserActivityStats(user.id),
      AnalyticsService.getStorageStats(user.id, timeRange),
      AnalyticsService.getProjectsStats(user.id, timeRange),
      AnalyticsService.getDailyUsage(user.id, days),
    ]);

    return {
      success: true,
      data: {
        renderStats,
        creditStats,
        apiUsageStats,
        userActivityStats,
        storageStats,
        projectsStats,
        dailyUsage,
      },
    };
  } catch (error) {
    logger.error('❌ Analytics Action: Failed to fetch analytics', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    };
  }
}

/**
 * Get render statistics only
 */
export async function getRenderStats(options: GetAnalyticsOptions = {}) {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    const { startDate, endDate } = options;
    const timeRange = startDate && endDate
      ? { startDate, endDate }
      : undefined;

    const renderStats = await AnalyticsService.getRenderStats(user.id, timeRange);

    return {
      success: true,
      data: renderStats,
    };
  } catch (error) {
    logger.error('❌ Analytics Action: Failed to fetch render stats', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch render stats'
    };
  }
}

/**
 * Get credit statistics only
 */
export async function getCreditStats(options: GetAnalyticsOptions = {}) {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    const { startDate, endDate } = options;
    const timeRange = startDate && endDate
      ? { startDate, endDate }
      : undefined;

    const creditStats = await AnalyticsService.getCreditStats(user.id, timeRange);

    return {
      success: true,
      data: creditStats,
    };
  } catch (error) {
    logger.error('❌ Analytics Action: Failed to fetch credit stats', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch credit stats'
    };
  }
}

/**
 * Get API usage statistics only
 */
export async function getApiUsageStats(options: GetAnalyticsOptions = {}) {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized'
      };
    }

    const { startDate, endDate } = options;
    const timeRange = startDate && endDate
      ? { startDate, endDate }
      : undefined;

    const apiUsageStats = await AnalyticsService.getApiUsageStats(user.id, timeRange);

    return {
      success: true,
      data: apiUsageStats,
    };
  } catch (error) {
    logger.error('❌ Analytics Action: Failed to fetch API usage stats', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch API usage stats'
    };
  }
}

