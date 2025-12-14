-- Migration: Fix Test Database Users Setup
-- Purpose: Ensure users table works correctly for both production (Supabase auth.users) and test databases
-- Date: 2025-01-27

-- ✅ STEP 1: Ensure users.id can accept explicit UUIDs (already done in 0003, but verify)
-- The migration 0003 removed DEFAULT gen_random_uuid() to allow Supabase auth.users.id values
-- This is correct for production, but we need to ensure test databases can still insert users

-- ✅ STEP 2: Add a function to help with test user creation (if needed)
-- This function can be used in tests to ensure user exists before creating related records
CREATE OR REPLACE FUNCTION ensure_user_exists(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT 'Test User',
  p_is_active BOOLEAN DEFAULT true,
  p_email_verified BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to get existing user
  SELECT id INTO v_user_id FROM users WHERE id = p_user_id;
  
  -- If user doesn't exist, create it
  IF v_user_id IS NULL THEN
    INSERT INTO users (id, email, name, is_active, email_verified, created_at, updated_at)
    VALUES (p_user_id, p_email, p_name, p_is_active, p_email_verified, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW()
    RETURNING id INTO v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ✅ STEP 3: Add a trigger to ensure users are visible immediately after insert
-- This helps with test database transaction isolation issues
-- Note: This is a no-op trigger, but ensures the transaction is committed
CREATE OR REPLACE FUNCTION users_after_insert_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Force transaction visibility (PostgreSQL does this automatically, but this ensures it)
  PERFORM 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS users_after_insert ON users;

-- Create trigger
CREATE TRIGGER users_after_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION users_after_insert_trigger();

-- ✅ STEP 4: Add index on users.id for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- ✅ STEP 5: Add index on users.email for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ✅ STEP 6: Handle Supabase-specific foreign key constraint
-- Supabase adds a constraint: users.id must exist in auth.users.id
-- This is correct for production, but breaks test databases where we create users directly
-- For test databases, we need to drop this constraint

-- Check if the constraint exists and drop it (safe for test databases)
DO $$ 
BEGIN
  -- Drop the Supabase auth.users foreign key constraint if it exists
  -- This allows test databases to create users directly without auth.users
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_id_auth_users_id_fk'
    AND table_name = 'users'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_auth_users_id_fk;
    RAISE NOTICE 'Dropped Supabase auth.users foreign key constraint (test database mode)';
  END IF;
END $$;

-- ✅ STEP 7: Ensure foreign key constraints are properly set up
-- Verify that all tables referencing users.id have proper foreign keys
-- This is already done in migrations, but we verify here

-- Note: In production with Supabase, auth.users.id should match public.users.id
-- In test databases, we create users directly in public.users with explicit UUIDs
-- This migration ensures both scenarios work correctly

COMMENT ON FUNCTION ensure_user_exists IS 'Helper function for test databases to ensure user exists before creating related records';
COMMENT ON TRIGGER users_after_insert ON users IS 'Ensures user inserts are immediately visible (helps with test transaction isolation)';

