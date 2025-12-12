/**
 * Database helper utilities for tests
 */

import { getTestDB } from '../fixtures/database';
import { sql } from 'drizzle-orm';

/**
 * Execute raw SQL query (useful for complex test scenarios)
 */
export async function executeRawSQL(query: string) {
  const db = getTestDB();
  return await db.execute(sql.raw(query));
}

/**
 * Get table row count
 */
export async function getTableCount(tableName: string): Promise<number> {
  const db = getTestDB();
  const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Check if table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const db = getTestDB();
  const result = await db.execute(
    sql.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      )
    `)
  );
  return result.rows[0]?.exists || false;
}

/**
 * Reset auto-increment sequences (if using serial IDs)
 */
export async function resetSequences() {
  const db = getTestDB();
  // PostgreSQL doesn't use sequences for UUIDs, but this is here for completeness
  // If you switch to serial IDs, uncomment and adjust:
  // await db.execute(sql.raw(`SELECT setval('users_id_seq', 1, false)`));
}



