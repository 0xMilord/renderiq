/**
 * GA4 Helper Functions
 * 
 * Utility functions for GA4 tracking that require database queries
 * or complex logic.
 */

import { db } from '@/lib/db';
import { renders, users } from '@/lib/db/schema';
import { eq, and, count, isNull } from 'drizzle-orm';

/**
 * Check if this is the user's first render
 * Used for idempotent first_render_* event tracking
 */
export async function isFirstRender(userId: string): Promise<boolean> {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(renders)
      .where(
        and(
          eq(renders.userId, userId),
          eq(renders.status, 'completed')
        )
      );
    
    return (result?.count || 0) === 0;
  } catch (error) {
    // If check fails, assume not first (safer for analytics)
    console.error('GA4 Helper: Failed to check first render', error);
    return false;
  }
}

/**
 * Get time to first render (milliseconds from signup)
 */
export async function getTimeToFirstRender(userId: string): Promise<number | null> {
  try {
    const [user] = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user?.createdAt) return null;
    
    const [firstRender] = await db
      .select({ createdAt: renders.createdAt })
      .from(renders)
      .where(
        and(
          eq(renders.userId, userId),
          eq(renders.status, 'completed')
        )
      )
      .orderBy(renders.createdAt)
      .limit(1);
    
    if (!firstRender?.createdAt) return null;
    
    return firstRender.createdAt.getTime() - user.createdAt.getTime();
  } catch (error) {
    console.error('GA4 Helper: Failed to get time to first render', error);
    return null;
  }
}

/**
 * Check if user has already activated (refined or exported a render)
 */
export async function hasUserActivated(userId: string): Promise<boolean> {
  try {
    // Check if user has any renders that were refined or exported
    // This is a simplified check - you may want to track this in a separate table
    const [result] = await db
      .select({ count: count() })
      .from(renders)
      .where(
        and(
          eq(renders.userId, userId),
          eq(renders.status, 'completed')
        )
      );
    
    // For now, consider user activated if they have at least one completed render
    // In the future, you might want to check for refine/export actions specifically
    return (result?.count || 0) > 0;
  } catch (error) {
    console.error('GA4 Helper: Failed to check user activation', error);
    return false;
  }
}

