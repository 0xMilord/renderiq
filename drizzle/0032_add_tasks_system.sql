-- Migration: Add Tasks & Rewards System
-- Date: 2025-01-27
-- Purpose: Create tables for VC-safe, product-native rewards system
-- ✅ VC-SAFE: Only rewards product-native actions (no social/reviews)

-- ============================================================================
-- TASK CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES task_categories(id) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  instructions TEXT,
  credits_reward INTEGER NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('automatic', 'manual', 'link_verification', 'api_verification', 'screenshot')),
  verification_config JSONB,
  cooldown_hours INTEGER DEFAULT 0 NOT NULL,
  max_completions INTEGER,
  is_active BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  requirements JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- USER TASKS (Task Completions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'verified', 'rejected', 'expired')),
  verification_data JSONB,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  credits_awarded INTEGER DEFAULT 0 NOT NULL,
  transaction_id UUID REFERENCES credit_transactions(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- TASK VERIFICATION LOGS (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_task_id UUID REFERENCES user_tasks(id) ON DELETE CASCADE NOT NULL,
  verification_method TEXT NOT NULL,
  verification_result TEXT NOT NULL CHECK (verification_result IN ('success', 'failed', 'pending')),
  verification_details JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- USER STREAKS (Streak Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_login_date DATE,
  streak_start_date DATE,
  total_login_days INTEGER DEFAULT 0 NOT NULL,
  grace_period_used BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_created_at ON user_tasks(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_task_cooldown ON user_tasks(user_id, task_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_slug ON tasks(slug);
CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_task_categories_slug ON task_categories(slug);
CREATE INDEX IF NOT EXISTS idx_task_verification_logs_user_task_id ON task_verification_logs(user_task_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE task_categories IS 'Task categories for organizing rewards';
COMMENT ON TABLE tasks IS 'Reward tasks - only product-native actions in MVP';
COMMENT ON TABLE user_tasks IS 'User task completions with verification status';
COMMENT ON TABLE task_verification_logs IS 'Audit trail for task verifications';
COMMENT ON TABLE user_streaks IS 'Daily login streak tracking with linear rewards';
