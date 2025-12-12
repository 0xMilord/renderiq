/**
 * User factory functions for tests
 */

import { createTestUser, getTestDB } from './database';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { NewUser } from '@/lib/db/schema';

/**
 * Create a test user with default values
 */
export async function createUser(data?: Partial<NewUser>) {
  return await createTestUser(data);
}

/**
 * Create multiple test users
 */
export async function createUsers(count: number, baseData?: Partial<NewUser>) {
  const userPromises = Array.from({ length: count }, (_, i) =>
    createTestUser({
      ...baseData,
      email: `user${i}-${Date.now()}@example.com`,
      name: baseData?.name || `Test User ${i}`,
    })
  );
  return Promise.all(userPromises);
}

/**
 * Create an admin user
 */
export async function createAdminUser(data?: Partial<NewUser>) {
  return await createTestUser({
    ...data,
    isAdmin: true,
    emailVerified: true,
  });
}

/**
 * Create an inactive user
 */
export async function createInactiveUser(data?: Partial<NewUser>) {
  return await createTestUser({
    ...data,
    isActive: false,
  });
}

/**
 * Get user by email from database
 */
export async function getUserByEmail(email: string) {
  const db = getTestDB();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user || null;
}



