-- Add platform column to projects table for proper classification
-- This prevents cross-contamination between render, tools, and canvas platforms

-- Add platform column with default 'render' for existing projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('render', 'tools', 'canvas')) DEFAULT 'render' NOT NULL;

-- Create index for filtering projects by platform
CREATE INDEX IF NOT EXISTS idx_projects_platform ON projects(platform);
CREATE INDEX IF NOT EXISTS idx_projects_user_platform ON projects(user_id, platform);

-- Update existing projects to have platform='render' (already set by default, but explicit update for clarity)
UPDATE projects SET platform = 'render' WHERE platform IS NULL OR platform = '';

-- Add comment
COMMENT ON COLUMN projects.platform IS 'Platform identifier: render, tools, or canvas. Used to filter projects by platform.';

