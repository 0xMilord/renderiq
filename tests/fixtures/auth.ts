/**
 * Auth helper functions for tests
 */

import { createTestUser, createTestSession, getTestDB } from './database';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Create a test user with session
 */
export async function createUserWithSession(data?: Partial<typeof users.$inferInsert>) {
  const user = await createTestUser(data);
  const session = await createTestSession(user.id);
  return { user, session };
}

/**
 * Create an authenticated user (email verified, active)
 */
export async function createAuthenticatedUser(data?: Partial<typeof users.$inferInsert>) {
  return await createTestUser({
    ...data,
    emailVerified: true,
    isActive: true,
  });
}

/**
 * Create a test session for a user
 */
export async function createSession(userId: string) {
  return await createTestSession(userId);
}

/**
 * Verify user exists in database
 */
export async function verifyUserExists(userId: string) {
  const db = getTestDB();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return !!user;
}

/**
 * Get user with all related data
 */
export async function getUserWithCredits(userId: string) {
  const db = getTestDB();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user) return null;
  
  // Get credits if needed (can be expanded)
  return { user };
}



