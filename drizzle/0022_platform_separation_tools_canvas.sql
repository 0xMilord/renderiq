-- Migration: Platform Separation - Tools, Canvas Files, and Render Isolation
-- This migration creates dedicated infrastructure for /apps (tools), /canvas (files), and isolates /render
-- Supports all media types: image, video, 3d, audio, doc

-- ============================================================================
-- 1. TOOLS INFRASTRUCTURE (/apps platform)
-- ============================================================================

-- Tools table: Tool definitions and metadata
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('transformation', 'floorplan', 'diagram', 'material', 'interior', '3d', 'presentation', 'video')),
  system_prompt TEXT NOT NULL,
  input_type TEXT NOT NULL CHECK (input_type IN ('image', 'image+text', 'multiple')),
  output_type TEXT NOT NULL CHECK (output_type IN ('image', 'video', '3d', 'audio', 'doc')),
  icon TEXT,
  color TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  settings_schema JSONB,  -- Tool-specific settings schema for validation
  default_settings JSONB,  -- Default settings for this tool
  seo_metadata JSONB,  -- SEO title, description, keywords
  metadata JSONB,  -- Additional tool metadata
  version INTEGER NOT NULL DEFAULT 1,  -- Tool version for updates
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tool executions: Track tool-specific executions separately from renders
CREATE TABLE IF NOT EXISTS tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Input tracking
  input_images JSONB,  -- Array of { fileId, url, key } for input images
  input_text TEXT,  -- Text input if applicable
  input_settings JSONB,  -- Tool-specific input settings (validated against tool.settings_schema)
  
  -- Output tracking
  output_render_id UUID REFERENCES renders(id) ON DELETE SET NULL,  -- Link to generated render (if applicable)
  output_url TEXT,  -- Direct output URL
  output_key TEXT,  -- Storage key
  output_file_id UUID REFERENCES file_storage(id) ON DELETE SET NULL,  -- Reference to file storage
  
  -- Execution metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  processing_time INTEGER,  -- Processing time in seconds
  credits_cost INTEGER NOT NULL DEFAULT 0,
  
  -- Reproducibility
  execution_config JSONB NOT NULL,  -- Full config for reproducibility (prompt, settings, inputs)
  parent_execution_id UUID REFERENCES tool_executions(id) ON DELETE SET NULL,  -- For variations/iterations
  
  -- Batch execution support
  batch_group_id UUID,  -- Groups related batch executions
  batch_index INTEGER,  -- Index within batch
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Tool settings templates: User-specific or global tool settings presets
CREATE TABLE IF NOT EXISTS tool_settings_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = global template
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB NOT NULL,  -- Tool-specific settings
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,  -- Allow sharing templates
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(tool_id, user_id, name)  -- User can't have duplicate template names per tool
);

-- Tool analytics: Track tool usage and performance
CREATE TABLE IF NOT EXISTS tool_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  execution_id UUID REFERENCES tool_executions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('execution_started', 'execution_completed', 'execution_failed', 'template_used', 'settings_saved')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. CANVAS INFRASTRUCTURE (/canvas platform - Figma-like structure)
-- ============================================================================

-- Canvas files: Like Figma files - Project → File → Canvas Graph
CREATE TABLE IF NOT EXISTS canvas_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  thumbnail_key TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(project_id, slug)  -- Unique slug per project
);

-- Update canvas_graphs to use canvas_files instead of render_chains
-- First, add new column
ALTER TABLE canvas_graphs 
  ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES canvas_files(id) ON DELETE CASCADE;

-- Create index for file_id
CREATE INDEX IF NOT EXISTS idx_canvas_graphs_file_id ON canvas_graphs(file_id);

-- Note: chain_id will be kept for backward compatibility during migration
-- It will be removed in a future migration after data migration

-- Canvas file versions: Version history for canvas files
CREATE TABLE IF NOT EXISTS canvas_file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES canvas_files(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  graph_id UUID REFERENCES canvas_graphs(id) ON DELETE SET NULL,
  name TEXT,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(file_id, version)
);

-- ============================================================================
-- 3. RENDER INFRASTRUCTURE (/render platform - Keep isolated)
-- ============================================================================

-- Add platform identifier to renders table to prevent cross-contamination
ALTER TABLE renders 
  ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('render', 'tools', 'canvas'));

-- Set default platform for existing renders based on chainId presence
-- Renders with chainId are from /render platform
UPDATE renders 
SET platform = 'render' 
WHERE platform IS NULL AND chain_id IS NOT NULL;

-- Renders with imageType in settings are from /apps platform (tools)
UPDATE renders 
SET platform = 'tools' 
WHERE platform IS NULL AND settings->>'imageType' IS NOT NULL;

-- Remaining renders default to 'render' (legacy)
UPDATE renders 
SET platform = 'render' 
WHERE platform IS NULL;

-- Add constraint to ensure render chains are only used by render platform
-- Note: This will be enforced at application level initially, then via triggers

-- Add constraint: renders with chainId must be platform='render'
ALTER TABLE renders
  ADD CONSTRAINT renders_chain_id_render_platform_check 
  CHECK (
    (chain_id IS NULL) OR (platform = 'render')
  );

-- Add constraint: renders with platform='tools' should not have chainId
ALTER TABLE renders
  ADD CONSTRAINT renders_tools_no_chain_check 
  CHECK (
    (platform != 'tools') OR (chain_id IS NULL)
  );

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Tools indexes
CREATE INDEX IF NOT EXISTS idx_tools_slug ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_output_type ON tools(output_type);

-- Tool executions indexes
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_id ON tool_executions(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_project_id ON tool_executions(project_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_user_id ON tool_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_status ON tool_executions(status);
CREATE INDEX IF NOT EXISTS idx_tool_executions_created_at ON tool_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_executions_batch_group_id ON tool_executions(batch_group_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_parent_execution_id ON tool_executions(parent_execution_id);

-- Tool settings templates indexes
CREATE INDEX IF NOT EXISTS idx_tool_settings_templates_tool_id ON tool_settings_templates(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_settings_templates_user_id ON tool_settings_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_settings_templates_is_default ON tool_settings_templates(tool_id, user_id, is_default) WHERE is_default = true;

-- Tool analytics indexes
CREATE INDEX IF NOT EXISTS idx_tool_analytics_tool_id ON tool_analytics(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_analytics_user_id ON tool_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_analytics_created_at ON tool_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_analytics_event_type ON tool_analytics(event_type);

-- Canvas files indexes
CREATE INDEX IF NOT EXISTS idx_canvas_files_project_id ON canvas_files(project_id);
CREATE INDEX IF NOT EXISTS idx_canvas_files_user_id ON canvas_files(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_files_slug ON canvas_files(project_id, slug);
CREATE INDEX IF NOT EXISTS idx_canvas_files_is_active ON canvas_files(is_active) WHERE is_active = true;

-- Canvas file versions indexes
CREATE INDEX IF NOT EXISTS idx_canvas_file_versions_file_id ON canvas_file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_canvas_file_versions_version ON canvas_file_versions(file_id, version DESC);

-- Renders platform index
CREATE INDEX IF NOT EXISTS idx_renders_platform ON renders(platform);

-- ============================================================================
-- 5. TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Tools updated_at trigger
CREATE OR REPLACE FUNCTION update_tools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW
  EXECUTE FUNCTION update_tools_updated_at();

-- Tool executions updated_at trigger
CREATE OR REPLACE FUNCTION update_tool_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tool_executions_updated_at
  BEFORE UPDATE ON tool_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_executions_updated_at();

-- Tool settings templates updated_at trigger
CREATE OR REPLACE FUNCTION update_tool_settings_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tool_settings_templates_updated_at
  BEFORE UPDATE ON tool_settings_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_settings_templates_updated_at();

-- Canvas files updated_at trigger
CREATE OR REPLACE FUNCTION update_canvas_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_canvas_files_updated_at
  BEFORE UPDATE ON canvas_files
  FOR EACH ROW
  EXECUTE FUNCTION update_canvas_files_updated_at();

-- ============================================================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE tools IS 'Tool definitions for /apps platform. Supports image, video, 3d, audio, doc output types.';
COMMENT ON TABLE tool_executions IS 'Tool execution tracking separate from renders. Enables reproducibility and tool-specific analytics.';
COMMENT ON TABLE tool_settings_templates IS 'User-specific or global tool settings presets for quick configuration.';
COMMENT ON TABLE tool_analytics IS 'Tool usage analytics and performance tracking.';
COMMENT ON TABLE canvas_files IS 'Canvas files (Figma-like) for /canvas platform. Project → File → Canvas Graph structure.';
COMMENT ON TABLE canvas_file_versions IS 'Version history for canvas files enabling undo/redo and collaboration.';
COMMENT ON COLUMN renders.platform IS 'Platform identifier: render (chat), tools (apps), canvas (node editor). Prevents cross-contamination.';

