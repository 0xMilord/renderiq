-- Migration: Add Payment Provider Support
-- Description: Add support for multiple payment providers (Razorpay, Paddle, LemonSqueezy)
-- Date: 2024-12-12

-- Add payment_provider to payment_orders
ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'razorpay' 
CHECK (payment_provider IN ('razorpay', 'paddle', 'lemonsqueezy'));

-- Add Paddle-specific fields to payment_orders
ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS paddle_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT;

-- Add LemonSqueezy-specific fields to payment_orders
ALTER TABLE payment_orders 
ADD COLUMN IF NOT EXISTS lemonsqueezy_order_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT;

-- Add indexes for provider-specific IDs
CREATE INDEX IF NOT EXISTS idx_payment_orders_paddle_transaction_id ON payment_orders(paddle_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_paddle_subscription_id ON payment_orders(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_lemonsqueezy_order_id ON payment_orders(lemonsqueezy_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_lemonsqueezy_subscription_id ON payment_orders(lemonsqueezy_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_payment_provider ON payment_orders(payment_provider);

-- Add payment_provider to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'razorpay'
CHECK (payment_provider IN ('razorpay', 'paddle', 'lemonsqueezy'));

-- Add Paddle-specific fields to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT;

-- Add LemonSqueezy-specific fields to user_subscriptions
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT;

-- Add indexes for provider-specific subscription IDs
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paddle_subscription_id ON user_subscriptions(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_paddle_customer_id ON user_subscriptions(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_lemonsqueezy_subscription_id ON user_subscriptions(lemonsqueezy_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_lemonsqueezy_customer_id ON user_subscriptions(lemonsqueezy_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_provider ON user_subscriptions(payment_provider);

-- Update existing records to have payment_provider = 'razorpay' (already default, but ensure consistency)
UPDATE payment_orders 
SET payment_provider = 'razorpay' 
WHERE payment_provider IS NULL;

UPDATE user_subscriptions 
SET payment_provider = 'razorpay' 
WHERE payment_provider IS NULL;

