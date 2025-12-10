-- Fix canvas_graphs: Make chain_id nullable and file_id required
-- new records
-- This migration fixes the issue where chain_id was still NOT NULL
-- but we're trying to insert records without it (using file_id instead)

-- Step 1: Make chain_id nullable (remove NOT NULL constraint)
ALTER TABLE canvas_graphs 
  ALTER COLUMN chain_id DROP NOT NULL;

-- Step 2: Note about file_id
-- We don't set NOT NULL constraint on file_id yet because there might be legacy records
-- without file_id. The application code ensures new records always have file_id.
-- For now, file_id remains nullable in the database but required in application code.

-- Step 3: Add unique constraint on file_id (one graph per file)
-- This ensures the Figma-like structure: one file = one graph
CREATE UNIQUE INDEX IF NOT EXISTS idx_canvas_graphs_file_id_unique 
  ON canvas_graphs(file_id) 
  WHERE file_id IS NOT NULL;

-- Note: chain_id is kept for backward compatibility but is now nullable
-- New records should always use file_id, not chain_id

