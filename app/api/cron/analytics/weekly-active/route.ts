/**
 * Cron Job: Weekly Active Users
 * 
 * Detects users who have been active in the last 7 days
 * Active = ≥2 sessions OR ≥3 renders
 * Fires `weekly_active` event via GA4 Measurement Protocol
 * 
 * Run weekly via cron scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, accountActivity, renders } from '@/lib/db/schema';
import { eq, and, gte, sql, count } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { sendWeeklyActiveEvent } from '@/lib/utils/ga4-measurement-protocol';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.log('🔄 Weekly Active Cron: Starting detection');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all users who have activity in last 7 days
    // First get users with login activity
    const usersWithLogins = await db
      .selectDistinct({
        userId: accountActivity.userId,
      })
      .from(accountActivity)
      .where(
        and(
          eq(accountActivity.eventType, 'login'),
          gte(accountActivity.createdAt, sevenDaysAgo)
        )
      );

    // Get users with renders
    const usersWithRenders = await db
      .selectDistinct({
        userId: renders.userId,
      })
      .from(renders)
      .where(gte(renders.createdAt, sevenDaysAgo));

    // Combine and deduplicate
    const allUserIds = new Set<string>();
    usersWithLogins.forEach(u => u.userId && allUserIds.add(u.userId));
    usersWithRenders.forEach(u => u.userId && allUserIds.add(u.userId));

    logger.log(`📊 Weekly Active Cron: Found ${allUserIds.size} potentially active users`);

    let trackedCount = 0;
    let errorCount = 0;

    for (const userId of allUserIds) {
      try {
        // Count sessions (login activities) in last 7 days
        const [sessionCount] = await db
          .select({ count: count() })
          .from(accountActivity)
          .where(
            and(
              eq(accountActivity.userId, userId),
              eq(accountActivity.eventType, 'login'),
              gte(accountActivity.createdAt, sevenDaysAgo)
            )
          );

        // Count renders in last 7 days
        const [renderCount] = await db
          .select({ count: count() })
          .from(renders)
          .where(
            and(
              eq(renders.userId, userId),
              gte(renders.createdAt, sevenDaysAgo)
            )
          );

        const sessions = Number(sessionCount?.count || 0);
        const renders = Number(renderCount?.count || 0);

        // User is weekly active if ≥2 sessions OR ≥3 renders
        if (sessions >= 2 || renders >= 3) {
          const result = await sendWeeklyActiveEvent(userId);

          if (result.success) {
            trackedCount++;
            logger.log(`✅ Weekly Active Cron: Tracked user ${userId} (${sessions} sessions, ${renders} renders)`);
          } else {
            errorCount++;
            logger.warn(`⚠️ Weekly Active Cron: Failed for user ${userId}:`, result.error);
          }
        }
      } catch (error) {
        errorCount++;
        logger.error(`❌ Weekly Active Cron: Error processing user ${userId}:`, error);
      }
    }

    logger.log(`✅ Weekly Active Cron: Complete - Tracked: ${trackedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      processed: allUserIds.size,
      tracked: trackedCount,
      errors: errorCount,
    });
  } catch (error) {
    logger.error('❌ Weekly Active Cron: Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

