/**
 * Global test setup file
 * This file runs before all tests
 * 
 * IMPORTANT: Environment variables must be set BEFORE any imports
 * that use the database connection
 */

// Set test environment variables FIRST (before any imports)
process.env.NODE_ENV = 'test';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/renderiq_test';
}

// Set other required test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test_anon_key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test_service_role_key';

// Now import test utilities
import { beforeAll, afterAll } from 'vitest';
import { setupTestDB, teardownTestDB } from './fixtures/database';

// Global setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  console.log(`📊 Using test database: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
  await setupTestDB();
  console.log('✅ Test environment ready');
});

// Global teardown
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  await teardownTestDB();
  console.log('✅ Test environment cleaned up');
});

// Extend Vitest matchers
import '@testing-library/jest-dom';

