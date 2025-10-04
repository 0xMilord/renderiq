-- Migration: Add Performance Indexes
-- Date: 2025-10-04
-- Purpose: Optimize database queries by adding indexes for frequently queried fields

-- ============================================================================
-- HIGH PRIORITY INDEXES - Renders Table
-- ============================================================================

-- Index for chain_id lookups (used in getByChainId)
CREATE INDEX IF NOT EXISTS idx_renders_chain_id ON renders(chain_id) WHERE chain_id IS NOT NULL;

-- Index for status filtering (used in getByStatus)
CREATE INDEX IF NOT EXISTS idx_renders_status ON renders(status);

-- Index for date ordering (used in all queries with ORDER BY created_at)
CREATE INDEX IF NOT EXISTS idx_renders_created_at ON renders(created_at DESC);

-- Composite index for chain queries with position ordering
CREATE INDEX IF NOT EXISTS idx_renders_chain_position ON renders(chain_id, chain_position) WHERE chain_id IS NOT NULL;

-- Composite index for common query pattern: project + status + date
CREATE INDEX IF NOT EXISTS idx_renders_project_status_created ON renders(project_id, status, created_at DESC);

-- Composite index for user renders with date ordering
CREATE INDEX IF NOT EXISTS idx_renders_user_created ON renders(user_id, created_at DESC);

-- ============================================================================
-- HIGH PRIORITY INDEXES - Render Chains Table
-- ============================================================================

-- Index for project lookups (used in getByProjectId)
CREATE INDEX IF NOT EXISTS idx_render_chains_project ON render_chains(project_id);

-- Index for date ordering
CREATE INDEX IF NOT EXISTS idx_render_chains_created ON render_chains(created_at DESC);

-- ============================================================================
-- HIGH PRIORITY INDEXES - Gallery Items Table
-- ============================================================================

-- Composite index for public gallery queries
CREATE INDEX IF NOT EXISTS idx_gallery_items_public_created ON gallery_items(is_public, created_at DESC) WHERE is_public = true;

-- Index for render lookups
CREATE INDEX IF NOT EXISTS idx_gallery_items_render ON gallery_items(render_id);

-- Index for user gallery items
CREATE INDEX IF NOT EXISTS idx_gallery_items_user ON gallery_items(user_id);

-- ============================================================================
-- HIGH PRIORITY INDEXES - User Credits Table
-- ============================================================================

-- Index for user credits lookup (used in getUserCredits)
CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id);

-- ============================================================================
-- HIGH PRIORITY INDEXES - User Subscriptions Table
-- ============================================================================

-- Composite index for active subscription queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status);

-- Index for period end date (used in reset calculations)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end) WHERE status = 'active';

-- ============================================================================
-- MEDIUM PRIORITY INDEXES - Credit Transactions Table
-- ============================================================================

-- Composite index for user transaction history
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);

-- Composite index for reference lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference ON credit_transactions(reference_type, reference_id) WHERE reference_id IS NOT NULL;

-- ============================================================================
-- MEDIUM PRIORITY INDEXES - File Storage Table
-- ============================================================================

-- Index for user file lookups
CREATE INDEX IF NOT EXISTS idx_file_storage_user ON file_storage(user_id);

-- Index for date ordering
CREATE INDEX IF NOT EXISTS idx_file_storage_created ON file_storage(created_at DESC);

-- ============================================================================
-- MEDIUM PRIORITY INDEXES - Projects Table
-- ============================================================================

-- Additional composite index for user projects with status
CREATE INDEX IF NOT EXISTS idx_projects_user_status_created ON projects(user_id, status, created_at DESC);

-- ============================================================================
-- VERIFY INDEXES
-- ============================================================================

-- To verify indexes were created, run:
-- SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- To check index usage, run:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;

