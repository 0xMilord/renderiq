/**
 * Cron Job: Second Session Detection
 * 
 * Detects users who have logged in again within 7 days of signup
 * Fires `second_session` event via GA4 Measurement Protocol
 * 
 * Run daily via cron scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, accountActivity } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { sendSecondSessionEvent } from '@/lib/utils/ga4-measurement-protocol';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.log('🔄 Second Session Cron: Starting detection');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get users who signed up in last 7 days
    const recentUsers = await db
      .select({
        id: users.id,
        createdAt: users.createdAt,
        email: users.email,
      })
      .from(users)
      .where(
        and(
          gte(users.createdAt, sevenDaysAgo),
          lte(users.createdAt, now)
        )
      );

    logger.log(`📊 Second Session Cron: Found ${recentUsers.length} recent signups`);

    let trackedCount = 0;
    let errorCount = 0;

    for (const user of recentUsers) {
      try {
        // Check if user has logged in again (more than one login activity)
        const loginActivities = await db
          .select()
          .from(accountActivity)
          .where(
            and(
              eq(accountActivity.userId, user.id),
              eq(accountActivity.eventType, 'login')
            )
          )
          .orderBy(desc(accountActivity.createdAt));

        // If user has 2+ logins, they've had a second session
        if (loginActivities.length >= 2) {
          const firstLogin = loginActivities[loginActivities.length - 1];
          const secondLogin = loginActivities[0];

          const daysSinceSignup = Math.floor(
            (secondLogin.createdAt.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysSinceLastSession = Math.floor(
            (secondLogin.createdAt.getTime() - firstLogin.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Only track if second session happened within 7 days of signup
          if (daysSinceSignup <= 7) {
            const result = await sendSecondSessionEvent(
              user.id,
              daysSinceSignup,
              daysSinceLastSession
            );

            if (result.success) {
              trackedCount++;
              logger.log(`✅ Second Session Cron: Tracked for user ${user.id}`);
            } else {
              errorCount++;
              logger.warn(`⚠️ Second Session Cron: Failed for user ${user.id}:`, result.error);
            }
          }
        }
      } catch (error) {
        errorCount++;
        logger.error(`❌ Second Session Cron: Error processing user ${user.id}:`, error);
      }
    }

    logger.log(`✅ Second Session Cron: Complete - Tracked: ${trackedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      processed: recentUsers.length,
      tracked: trackedCount,
      errors: errorCount,
    });
  } catch (error) {
    logger.error('❌ Second Session Cron: Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

