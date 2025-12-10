-- Migration: Advanced Performance Optimizations (Drizzle + PostgreSQL 2025 Best Practices)
-- Date: 2025-01-27
-- Purpose: Add advanced indexes, GIN indexes for JSONB, composite indexes, and covering indexes
-- Based on: Drizzle ORM best practices and PostgreSQL 15+ optimization guidelines

-- ============================================================================
-- 1. COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Tools: Composite indexes for filtering + sorting
CREATE INDEX IF NOT EXISTS idx_tools_category_status_active 
  ON tools(category, status, is_active) 
  WHERE is_active = true AND status = 'online';

CREATE INDEX IF NOT EXISTS idx_tools_output_type_status 
  ON tools(output_type, status, priority, name) 
  WHERE is_active = true;

-- Tool Executions: Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tool_executions_user_created 
  ON tool_executions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_executions_project_created 
  ON tool_executions(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_status_created 
  ON tool_executions(tool_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_executions_user_tool_created 
  ON tool_executions(user_id, tool_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_executions_batch_group_status 
  ON tool_executions(batch_group_id, status, batch_index) 
  WHERE batch_group_id IS NOT NULL;

-- Tool Settings Templates: Composite for default template lookups
CREATE INDEX IF NOT EXISTS idx_tool_settings_templates_tool_user_default 
  ON tool_settings_templates(tool_id, user_id, is_default) 
  WHERE is_default = true;

-- Tool Analytics: Composite for analytics queries
CREATE INDEX IF NOT EXISTS idx_tool_analytics_tool_event_created 
  ON tool_analytics(tool_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_analytics_user_created 
  ON tool_analytics(user_id, created_at DESC);

-- Canvas Files: Composite indexes
CREATE INDEX IF NOT EXISTS idx_canvas_files_project_active_updated 
  ON canvas_files(project_id, is_active, updated_at DESC) 
  WHERE is_active = true AND is_archived = false;

CREATE INDEX IF NOT EXISTS idx_canvas_files_user_active_updated 
  ON canvas_files(user_id, is_active, updated_at DESC) 
  WHERE is_active = true AND is_archived = false;

-- Canvas File Versions: Composite for version queries
CREATE INDEX IF NOT EXISTS idx_canvas_file_versions_file_version_desc 
  ON canvas_file_versions(file_id, version DESC);

-- Canvas Graphs: Composite for file-based queries
CREATE INDEX IF NOT EXISTS idx_canvas_graphs_file_id 
  ON canvas_graphs(file_id) 
  WHERE file_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_canvas_graphs_chain_id 
  ON canvas_graphs(chain_id) 
  WHERE chain_id IS NOT NULL;

-- ============================================================================
-- 2. GIN INDEXES FOR JSONB COLUMNS (PostgreSQL 2025 Best Practice)
-- ============================================================================

-- Tools: GIN indexes for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_tools_settings_schema_gin 
  ON tools USING GIN (settings_schema jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_tools_default_settings_gin 
  ON tools USING GIN (default_settings jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_tools_metadata_gin 
  ON tools USING GIN (metadata jsonb_path_ops);

-- Tool Executions: GIN indexes for JSONB input/output queries
CREATE INDEX IF NOT EXISTS idx_tool_executions_input_images_gin 
  ON tool_executions USING GIN (input_images jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_tool_executions_input_settings_gin 
  ON tool_executions USING GIN (input_settings jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_tool_executions_execution_config_gin 
  ON tool_executions USING GIN (execution_config jsonb_path_ops);

-- Tool Settings Templates: GIN for settings queries
CREATE INDEX IF NOT EXISTS idx_tool_settings_templates_settings_gin 
  ON tool_settings_templates USING GIN (settings jsonb_path_ops);

-- Tool Analytics: GIN for metadata queries
CREATE INDEX IF NOT EXISTS idx_tool_analytics_metadata_gin 
  ON tool_analytics USING GIN (metadata jsonb_path_ops);

-- Canvas Files: GIN for metadata queries
CREATE INDEX IF NOT EXISTS idx_canvas_files_metadata_gin 
  ON canvas_files USING GIN (metadata jsonb_path_ops);

-- Renders: GIN for settings JSONB (if not already exists)
CREATE INDEX IF NOT EXISTS idx_renders_settings_gin 
  ON renders USING GIN (settings jsonb_path_ops);

-- ============================================================================
-- 3. COVERING INDEXES (INCLUDE columns for index-only scans)
-- ============================================================================

-- Tool Executions: Covering index for status queries with common fields
CREATE INDEX IF NOT EXISTS idx_tool_executions_status_covering 
  ON tool_executions(status, created_at DESC) 
  INCLUDE (id, tool_id, project_id, user_id, output_url, output_render_id);

-- Tool Executions: Covering index for user queries
CREATE INDEX IF NOT EXISTS idx_tool_executions_user_covering 
  ON tool_executions(user_id, created_at DESC) 
  INCLUDE (id, tool_id, status, output_url);

-- Canvas Files: Covering index for project queries
CREATE INDEX IF NOT EXISTS idx_canvas_files_project_covering 
  ON canvas_files(project_id, updated_at DESC) 
  INCLUDE (id, name, slug, thumbnail_url, is_active);

-- ============================================================================
-- 4. PARTIAL INDEXES FOR FILTERED QUERIES (PostgreSQL 2025 Best Practice)
-- ============================================================================

-- Tool Executions: Partial indexes for active/pending executions
CREATE INDEX IF NOT EXISTS idx_tool_executions_pending 
  ON tool_executions(created_at DESC) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_tool_executions_processing 
  ON tool_executions(created_at DESC) 
  WHERE status = 'processing';

CREATE INDEX IF NOT EXISTS idx_tool_executions_completed 
  ON tool_executions(created_at DESC) 
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_tool_executions_failed 
  ON tool_executions(created_at DESC, error_message) 
  WHERE status = 'failed';

-- Tools: Partial index for active tools only
CREATE INDEX IF NOT EXISTS idx_tools_active_online 
  ON tools(category, output_type, priority, name) 
  WHERE is_active = true AND status = 'online';

-- Canvas Files: Partial index for active files
CREATE INDEX IF NOT EXISTS idx_canvas_files_active 
  ON canvas_files(project_id, updated_at DESC) 
  WHERE is_active = true AND is_archived = false;

-- ============================================================================
-- 5. FUNCTIONAL INDEXES FOR COMMON EXPRESSIONS
-- ============================================================================

-- Tool Executions: Functional index for date range queries
CREATE INDEX IF NOT EXISTS idx_tool_executions_date_trunc_created 
  ON tool_executions(DATE_TRUNC('day', created_at) DESC);

-- Tool Analytics: Functional index for date-based analytics
CREATE INDEX IF NOT EXISTS idx_tool_analytics_date_trunc_created 
  ON tool_analytics(tool_id, DATE_TRUNC('day', created_at) DESC);

-- ============================================================================
-- 6. FOREIGN KEY INDEXES (if not already covered)
-- ============================================================================

-- Ensure all foreign keys have indexes (PostgreSQL best practice)
-- Most are already covered, but adding any missing ones

-- Tool Executions: Output render reference
CREATE INDEX IF NOT EXISTS idx_tool_executions_output_render_id 
  ON tool_executions(output_render_id) 
  WHERE output_render_id IS NOT NULL;

-- Tool Executions: Output file reference
CREATE INDEX IF NOT EXISTS idx_tool_executions_output_file_id 
  ON tool_executions(output_file_id) 
  WHERE output_file_id IS NOT NULL;

-- Tool Executions: Parent execution reference
CREATE INDEX IF NOT EXISTS idx_tool_executions_parent_execution_id 
  ON tool_executions(parent_execution_id) 
  WHERE parent_execution_id IS NOT NULL;

-- ============================================================================
-- 7. UNIQUE INDEXES FOR CONSTRAINTS (if not already exists)
-- ============================================================================

-- Tools: Ensure slug uniqueness (should already exist, but verify)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tools_slug_unique 
  ON tools(slug);

-- Canvas Files: Ensure project+slug uniqueness (should already exist)
CREATE UNIQUE INDEX IF NOT EXISTS idx_canvas_files_project_slug_unique 
  ON canvas_files(project_id, slug);

-- Tool Settings Templates: Ensure unique constraint index
CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_settings_templates_tool_user_name_unique 
  ON tool_settings_templates(tool_id, user_id, name) 
  WHERE user_id IS NOT NULL;

-- Canvas File Versions: Ensure unique constraint index
CREATE UNIQUE INDEX IF NOT EXISTS idx_canvas_file_versions_file_version_unique 
  ON canvas_file_versions(file_id, version);

-- ============================================================================
-- 8. STATISTICS UPDATES FOR QUERY PLANNER (PostgreSQL 2025 Best Practice)
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE tools;
ANALYZE tool_executions;
ANALYZE tool_settings_templates;
ANALYZE tool_analytics;
ANALYZE canvas_files;
ANALYZE canvas_file_versions;
ANALYZE canvas_graphs;
ANALYZE renders;

-- ============================================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_tools_category_status_active IS 'Composite index for filtering active online tools by category';
COMMENT ON INDEX idx_tool_executions_user_created IS 'Composite index for user execution history queries';
COMMENT ON INDEX idx_tool_executions_tool_status_created IS 'Composite index for tool-specific execution queries with status filtering';
COMMENT ON INDEX idx_tools_settings_schema_gin IS 'GIN index for JSONB settings_schema queries';
COMMENT ON INDEX idx_tool_executions_input_settings_gin IS 'GIN index for JSONB input_settings queries';
COMMENT ON INDEX idx_tool_executions_status_covering IS 'Covering index for status queries to enable index-only scans';
COMMENT ON INDEX idx_tool_executions_pending IS 'Partial index for pending executions only';

-- ============================================================================
-- 10. VERIFICATION QUERIES (for monitoring)
-- ============================================================================

-- To verify indexes were created:
-- SELECT schemaname, tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('tools', 'tool_executions', 'tool_settings_templates', 'tool_analytics', 'canvas_files', 'canvas_file_versions')
-- ORDER BY tablename, indexname;

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('tools', 'tool_executions', 'tool_settings_templates', 'tool_analytics', 'canvas_files', 'canvas_file_versions')
-- ORDER BY idx_scan DESC;

-- To check index sizes:
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('tools', 'tool_executions', 'tool_settings_templates', 'tool_analytics', 'canvas_files', 'canvas_file_versions')
-- ORDER BY pg_relation_size(indexrelid) DESC;

