import { db } from '@/lib/db';
import { usageTracking } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export interface UsageTrackingData {
  userId: string;
  date: Date;
  rendersCreated?: number;
  creditsSpent?: number;
  storageUsed?: number;
  apiCalls?: number;
}

export class UsageTrackingDAL {
  /**
   * Record or update daily usage tracking
   * Uses upsert to handle same-day updates
   */
  static async recordUsage(data: UsageTrackingData) {
    logger.log('📊 UsageTrackingDAL: Recording usage', {
      userId: data.userId,
      date: data.date.toISOString().split('T')[0]
    });

    try {
      // Get start of day for the date
      const dateStart = new Date(data.date);
      dateStart.setHours(0, 0, 0, 0);

      // Check if record exists for this user and date
      const [existing] = await db
        .select()
        .from(usageTracking)
        .where(
          and(
            eq(usageTracking.userId, data.userId),
            eq(usageTracking.date, dateStart)
          )
        )
        .limit(1);

      if (existing) {
        // Update existing record
        const [updated] = await db
          .update(usageTracking)
          .set({
            rendersCreated: (existing.rendersCreated || 0) + (data.rendersCreated || 0),
            creditsSpent: (existing.creditsSpent || 0) + (data.creditsSpent || 0),
            storageUsed: (existing.storageUsed || 0) + (data.storageUsed || 0),
            apiCalls: (existing.apiCalls || 0) + (data.apiCalls || 0),
          })
          .where(eq(usageTracking.id, existing.id))
          .returning();

        logger.log('✅ UsageTrackingDAL: Updated existing usage record', updated.id);
        return updated;
      } else {
        // Create new record
        const [created] = await db
          .insert(usageTracking)
          .values({
            userId: data.userId,
            date: dateStart,
            rendersCreated: data.rendersCreated || 0,
            creditsSpent: data.creditsSpent || 0,
            storageUsed: data.storageUsed || 0,
            apiCalls: data.apiCalls || 0,
          })
          .returning();

        logger.log('✅ UsageTrackingDAL: Created new usage record', created.id);
        return created;
      }
    } catch (error) {
      logger.error('❌ UsageTrackingDAL: Failed to record usage', error);
      throw error;
    }
  }

  /**
   * Get usage tracking for a user within a date range
   */
  static async getUserUsage(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    logger.log('📊 UsageTrackingDAL: Fetching user usage', {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const records = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          gte(usageTracking.date, start),
          lte(usageTracking.date, end)
        )
      )
      .orderBy(desc(usageTracking.date));

    logger.log(`✅ UsageTrackingDAL: Found ${records.length} usage records`);
    return records;
  }

  /**
   * Get aggregated usage stats for a user
   */
  static async getUserUsageStats(userId: string, days: number = 30) {
    logger.log('📊 UsageTrackingDAL: Fetching aggregated usage stats', {
      userId,
      days
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const [stats] = await db
      .select({
        totalRenders: sql<number>`COALESCE(SUM(${usageTracking.rendersCreated}), 0)`.as('totalRenders'),
        totalCreditsSpent: sql<number>`COALESCE(SUM(${usageTracking.creditsSpent}), 0)`.as('totalCreditsSpent'),
        totalStorageUsed: sql<number>`COALESCE(SUM(${usageTracking.storageUsed}), 0)`.as('totalStorageUsed'),
        totalApiCalls: sql<number>`COALESCE(SUM(${usageTracking.apiCalls}), 0)`.as('totalApiCalls'),
        averageRendersPerDay: sql<number>`COALESCE(AVG(${usageTracking.rendersCreated}), 0)`.as('averageRendersPerDay'),
        averageCreditsPerDay: sql<number>`COALESCE(AVG(${usageTracking.creditsSpent}), 0)`.as('averageCreditsPerDay'),
      })
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          gte(usageTracking.date, startDate)
        )
      );

    logger.log('✅ UsageTrackingDAL: Aggregated stats calculated');
    return stats || {
      totalRenders: 0,
      totalCreditsSpent: 0,
      totalStorageUsed: 0,
      totalApiCalls: 0,
      averageRendersPerDay: 0,
      averageCreditsPerDay: 0,
    };
  }
}

