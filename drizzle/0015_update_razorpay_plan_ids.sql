-- Migration: Update Razorpay Plan IDs
-- Description: Update subscription_plans table with Razorpay Plan IDs from Dashboard
-- Created: 03 Dec 2025
-- Plan IDs from Razorpay Dashboard:
--   Pro Monthly: plan_Rn3lmBVjGI02dN (₹499.00)
--   Pro Annual: plan_Rn3moB87xZ4vB8 (₹4,790.00)
--   Enterprise Monthly: plan_Rn3nUhCt7lZnrQ (₹4,999.00)
--   Enterprise Annual: plan_Rn3oMq9i8HeGl4 (₹44,999.00)

-- Update Pro Monthly plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_Rn3lmBVjGI02dN',
    updated_at = now()
WHERE name = 'Pro' 
  AND interval = 'month' 
  AND price = 499.00;

-- Update Pro Annual plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_Rn3moB87xZ4vB8',
    updated_at = now()
WHERE name = 'Pro Annual' 
  AND interval = 'year' 
  AND price = 4790.00;

-- Update Enterprise Monthly plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_Rn3nUhCt7lZnrQ',
    updated_at = now()
WHERE name = 'Enterprise' 
  AND interval = 'month' 
  AND price = 4999.00;

-- Update Enterprise Annual plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_Rn3oMq9i8HeGl4',
    updated_at = now()
WHERE name = 'Enterprise Annual' 
  AND interval = 'year' 
  AND price = 44999.00;

