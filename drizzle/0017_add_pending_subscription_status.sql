-- Migration: Add 'pending' status to subscription status enum
-- Description: Add 'pending' status to allow subscriptions to be created before payment is completed
-- This prevents users from being marked as 'pro' until payment is successful

-- Add CHECK constraint to ensure only valid statuses are allowed
-- This includes the new 'pending' status for subscriptions awaiting payment
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'user_subscriptions_status_check'
    ) THEN
        ALTER TABLE user_subscriptions 
        DROP CONSTRAINT user_subscriptions_status_check;
    END IF;

    -- Add new constraint with 'pending' status included
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_status_check 
    CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'pending'));
END $$;

-- Add comment to document the status values
COMMENT ON COLUMN user_subscriptions.status IS 
'Subscription status: active (payment successful), pending (awaiting payment), canceled (cancelled by user), past_due (payment failed), unpaid (payment required)';

