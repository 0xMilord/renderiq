import { db } from '@/lib/db';
import { renders, creditTransactions, accountActivity, pluginApiKeys, users } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql, count, inArray } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { UsageTrackingDAL } from '@/lib/dal/usage-tracking';

export interface AnalyticsTimeRange {
  startDate: Date;
  endDate: Date;
}

export interface RenderStats {
  total: number;
  byType: { image: number; video: number };
  byStatus: { completed: number; failed: number; pending: number; processing: number };
  byQuality: { standard: number; high: number; ultra: number };
  byPlatform: { render: number; tools: number; canvas: number; plugin: number };
  averageProcessingTime: number;
  totalCreditsSpent: number;
  successRate: number;
}

export interface CreditStats {
  totalSpent: number;
  totalEarned: number;
  netBalance: number;
  byType: {
    render: number;
    refund: number;
    purchase: number;
    subscription: number;
    bonus: number;
  };
  averagePerDay: number;
}

export interface ApiUsageStats {
  totalCalls: number;
  byPlatform: Record<string, number>;
  byRoute: Record<string, number>;
  averagePerDay: number;
  uniqueApiKeys: number;
  activeApiKeys: number;
}

export interface UserActivityStats {
  totalLogins: number;
  totalSignups: number;
  lastLoginAt: Date | null;
  accountAge: number; // days
}

export interface DailyUsageData {
  date: string;
  rendersCreated: number;
  creditsSpent: number;
  apiCalls: number;
  storageUsed: number;
}

export class AnalyticsService {
  /**
   * Get comprehensive render statistics for a user
   */
  static async getRenderStats(
    userId: string,
    timeRange?: AnalyticsTimeRange
  ): Promise<RenderStats> {
    logger.log('📊 AnalyticsService: Fetching render stats', { userId, timeRange });

    const whereConditions = [eq(renders.userId, userId)];
    if (timeRange) {
      whereConditions.push(
        gte(renders.createdAt, timeRange.startDate),
        lte(renders.createdAt, timeRange.endDate)
      );
    }

    // Get all renders for aggregation
    const allRenders = await db
      .select()
      .from(renders)
      .where(and(...whereConditions));

    const total = allRenders.length;
    const byType = {
      image: allRenders.filter(r => r.type === 'image').length,
      video: allRenders.filter(r => r.type === 'video').length,
    };

    const byStatus = {
      completed: allRenders.filter(r => r.status === 'completed').length,
      failed: allRenders.filter(r => r.status === 'failed').length,
      pending: allRenders.filter(r => r.status === 'pending').length,
      processing: allRenders.filter(r => r.status === 'processing').length,
    };

    const byQuality = {
      standard: allRenders.filter(r => r.settings?.quality === 'standard').length,
      high: allRenders.filter(r => r.settings?.quality === 'high').length,
      ultra: allRenders.filter(r => r.settings?.quality === 'ultra').length,
    };

    // Group by platform (render, tools, canvas, or plugin if metadata.sourcePlatform exists)
    const byPlatform = {
      render: allRenders.filter(r => r.platform === 'render' || (!r.platform && !r.metadata?.sourcePlatform)).length,
      tools: allRenders.filter(r => r.platform === 'tools').length,
      canvas: allRenders.filter(r => r.platform === 'canvas').length,
      plugin: allRenders.filter(r => !!r.metadata?.sourcePlatform).length,
    };

    const completedRenders = allRenders.filter(r => r.status === 'completed' && r.processingTime);
    const averageProcessingTime = completedRenders.length > 0
      ? completedRenders.reduce((sum, r) => sum + (r.processingTime || 0), 0) / completedRenders.length
      : 0;

    const totalCreditsSpent = allRenders.reduce((sum, r) => sum + (r.creditsCost || 0), 0);

    const successRate = total > 0
      ? (byStatus.completed / total) * 100
      : 0;

    return {
      total,
      byType,
      byStatus,
      byQuality,
      byPlatform,
      averageProcessingTime,
      totalCreditsSpent,
      successRate,
    };
  }

  /**
   * Get credit statistics for a user
   */
  static async getCreditStats(
    userId: string,
    timeRange?: AnalyticsTimeRange
  ): Promise<CreditStats> {
    logger.log('📊 AnalyticsService: Fetching credit stats', { userId, timeRange });

    const whereConditions = [eq(creditTransactions.userId, userId)];
    if (timeRange) {
      whereConditions.push(
        gte(creditTransactions.createdAt, timeRange.startDate),
        lte(creditTransactions.createdAt, timeRange.endDate)
      );
    }

    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(and(...whereConditions))
      .orderBy(desc(creditTransactions.createdAt));

    const totalSpent = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalEarned = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const byType = {
      render: transactions
        .filter(t => t.type === 'debit' && t.referenceType === 'render')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      refund: transactions
        .filter(t => t.type === 'credit' && t.referenceType === 'refund')
        .reduce((sum, t) => sum + t.amount, 0),
      purchase: transactions
        .filter(t => t.type === 'credit' && t.referenceType === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0),
      subscription: transactions
        .filter(t => t.type === 'credit' && t.referenceType === 'subscription')
        .reduce((sum, t) => sum + t.amount, 0),
      bonus: transactions
        .filter(t => t.type === 'credit' && t.referenceType === 'bonus')
        .reduce((sum, t) => sum + t.amount, 0),
    };

    const days = timeRange
      ? Math.ceil((timeRange.endDate.getTime() - timeRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const averagePerDay = days > 0 ? totalSpent / days : 0;

    return {
      totalSpent,
      totalEarned,
      netBalance: totalEarned - totalSpent,
      byType,
      averagePerDay,
    };
  }

  /**
   * Get API usage statistics
   */
  static async getApiUsageStats(
    userId: string,
    timeRange?: AnalyticsTimeRange
  ): Promise<ApiUsageStats> {
    logger.log('📊 AnalyticsService: Fetching API usage stats', { userId, timeRange });

    // Get API keys for user
    const apiKeys = await db
      .select()
      .from(pluginApiKeys)
      .where(eq(pluginApiKeys.userId, userId));

    const uniqueApiKeys = apiKeys.length;
    const activeApiKeys = apiKeys.filter(k => k.isActive && k.lastUsedAt).length;

    // Get renders with plugin metadata (API calls)
    const whereConditions = [
      eq(renders.userId, userId),
      sql`${renders.metadata}->>'sourcePlatform' IS NOT NULL`
    ];
    if (timeRange) {
      whereConditions.push(
        gte(renders.createdAt, timeRange.startDate),
        lte(renders.createdAt, timeRange.endDate)
      );
    }

    const apiRenders = await db
      .select()
      .from(renders)
      .where(and(...whereConditions));

    const totalCalls = apiRenders.length;

    // Group by platform
    const byPlatform: Record<string, number> = {};
    apiRenders.forEach(render => {
      const platform = render.metadata?.sourcePlatform as string || 'unknown';
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
    });

    // Get usage tracking data
    const usageData = await UsageTrackingDAL.getUserUsage(
      userId,
      timeRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      timeRange?.endDate || new Date()
    );

    const totalApiCallsFromTracking = usageData.reduce((sum, u) => sum + (u.apiCalls || 0), 0);
    const days = timeRange
      ? Math.ceil((timeRange.endDate.getTime() - timeRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const averagePerDay = days > 0 ? (totalCalls + totalApiCallsFromTracking) / days : 0;

    return {
      totalCalls: totalCalls + totalApiCallsFromTracking,
      byPlatform,
      byRoute: {}, // Would need separate API route tracking table
      averagePerDay,
      uniqueApiKeys,
      activeApiKeys,
    };
  }

  /**
   * Get user activity statistics
   */
  static async getUserActivityStats(userId: string): Promise<UserActivityStats> {
    logger.log('📊 AnalyticsService: Fetching user activity stats', { userId });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const activities = await db
      .select()
      .from(accountActivity)
      .where(eq(accountActivity.userId, userId))
      .orderBy(desc(accountActivity.createdAt));

    const totalLogins = activities.filter(a => a.eventType === 'login').length;
    const totalSignups = activities.filter(a => a.eventType === 'signup').length;

    const lastLogin = activities.find(a => a.eventType === 'login');
    const lastLoginAt = lastLogin?.createdAt || user?.lastLoginAt || null;

    const accountAge = user?.createdAt
      ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalLogins,
      totalSignups,
      lastLoginAt,
      accountAge,
    };
  }

  /**
   * Get daily usage data for charts
   */
  static async getDailyUsage(
    userId: string,
    days: number = 30
  ): Promise<DailyUsageData[]> {
    logger.log('📊 AnalyticsService: Fetching daily usage', { userId, days });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get usage tracking records
    const usageRecords = await UsageTrackingDAL.getUserUsage(userId, startDate, endDate);

    // Create a map of dates to fill in missing days
    const dateMap = new Map<string, DailyUsageData>();
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        rendersCreated: 0,
        creditsSpent: 0,
        apiCalls: 0,
        storageUsed: 0,
      });
    }

    // Fill in actual data
    usageRecords.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          date: dateStr,
          rendersCreated: record.rendersCreated || 0,
          creditsSpent: record.creditsSpent || 0,
          apiCalls: record.apiCalls || 0,
          storageUsed: record.storageUsed || 0,
        });
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Record render creation in usage tracking
   */
  static async recordRenderCreation(
    userId: string,
    creditsCost: number,
    isApiCall: boolean = false
  ) {
    logger.log('📊 AnalyticsService: Recording render creation', {
      userId,
      creditsCost,
      isApiCall
    });

    try {
      await UsageTrackingDAL.recordUsage({
        userId,
        date: new Date(),
        rendersCreated: 1,
        creditsSpent: creditsCost,
        apiCalls: isApiCall ? 1 : 0,
      });
    } catch (error) {
      logger.error('❌ AnalyticsService: Failed to record render creation', error);
      // Don't throw - usage tracking shouldn't break render creation
    }
  }
}

