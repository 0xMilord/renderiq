/**
 * Database override for testing
 * Uses environment variable to point to test database
 * The lib/db module will use the DATABASE_URL from environment
 */

import * as schema from '@/lib/db/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

let testDbInstance: PostgresJsDatabase<typeof schema> | null = null;

/**
 * Override the database connection for testing
 * Note: This works by ensuring DATABASE_URL points to test database
 * The lib/db module will automatically use the test connection
 */
export function overrideDatabaseForTesting(db: PostgresJsDatabase<typeof schema>) {
  testDbInstance = db;
  
  // The actual override happens in tests/fixtures/database.ts
  // by setting up the test database connection before lib/db is imported
  // We store the instance here for reference
}

/**
 * Restore the original database connection
 * Note: In practice, we just clean up the test connection
 */
export function restoreDatabase() {
  testDbInstance = null;
}

/**
 * Get the test database instance
 */
export function getTestDatabase(): PostgresJsDatabase<typeof schema> {
  if (!testDbInstance) {
    throw new Error('Test database not initialized. Call overrideDatabaseForTesting() first.');
  }
  return testDbInstance;
}

