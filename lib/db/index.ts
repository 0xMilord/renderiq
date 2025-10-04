import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL;

// Global connection cache for serverless
declare global {
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
  var __dbClient: ReturnType<typeof postgres> | undefined;
}

// Reuse connection across hot reloads in development
// In production, each serverless function instance will have its own connection
if (!global.__dbClient) {
  global.__dbClient = postgres(connectionString, {
    ssl: 'require',
    max: 1, // Single connection per instance
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Required for Supabase connection pooler
    onnotice: () => {}, // Suppress notices
  });
}

if (!global.__db) {
  global.__db = drizzle(global.__dbClient, { schema });
}

export const db = global.__db;

// Export function to close connection (useful for cleanup)
export const closeConnection = async () => {
  if (global.__dbClient) {
    await global.__dbClient.end();
    global.__dbClient = undefined;
    global.__db = undefined;
  }
};
