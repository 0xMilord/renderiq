-- ✅ OPTIMIZATION: Add indexes to speed up subscription EXISTS subqueries in gallery
-- These indexes will significantly improve the performance of the EXISTS subquery
-- that checks if a user has an active Pro/Starter/Enterprise subscription

-- Index on user_subscriptions for fast lookup by user_id and status
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status 
  ON user_subscriptions(user_id, status) 
  WHERE status = 'active';

-- Index on subscription_plans for fast name lookup
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name 
  ON subscription_plans(name);

-- Composite index for the EXISTS subquery join condition
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_status 
  ON user_subscriptions(plan_id, status, user_id) 
  WHERE status = 'active';

-- Index on gallery_items for faster filtering and sorting
CREATE INDEX IF NOT EXISTS idx_gallery_items_public_created 
  ON gallery_items(is_public, created_at DESC) 
  WHERE is_public = true;

-- Index on gallery_items for likes/views sorting
CREATE INDEX IF NOT EXISTS idx_gallery_items_public_engagement 
  ON gallery_items(is_public, likes DESC, views DESC) 
  WHERE is_public = true;

-- Index on renders for type filtering
CREATE INDEX IF NOT EXISTS idx_renders_type_status 
  ON renders(type, status) 
  WHERE status = 'completed';

-- Index on tool_executions for faster tool joins
CREATE INDEX IF NOT EXISTS idx_tool_executions_output_render 
  ON tool_executions(output_render_id) 
  WHERE output_render_id IS NOT NULL;

