-- Script to update Razorpay Plan IDs in subscription_plans table
-- Replace the 'plan_xxxxx' placeholders with your actual Razorpay Plan IDs

-- Step 1: View current plans (to verify before updating)
SELECT 
  id,
  name,
  description,
  price,
  currency,
  interval,
  credits_per_month,
  razorpay_plan_id,
  is_active,
  CASE 
    WHEN razorpay_plan_id IS NULL AND name != 'Free' THEN '⚠️ Missing Razorpay Plan ID'
    WHEN razorpay_plan_id IS NOT NULL THEN '✅ Configured'
    ELSE '✅ Free Plan (No ID needed)'
  END as status
FROM subscription_plans
WHERE is_active = true
ORDER BY 
  CASE name 
    WHEN 'Free' THEN 1
    WHEN 'Pro' THEN 2
    WHEN 'Pro Annual' THEN 3
    WHEN 'Enterprise' THEN 4
    WHEN 'Enterprise Annual' THEN 5
  END,
  interval;

-- Step 2: Update Pro Monthly plan
-- Replace 'plan_xxxxx' with your actual Razorpay Plan ID from Dashboard
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_xxxxx', -- TODO: Replace with actual Plan ID
    updated_at = now()
WHERE name = 'Pro' 
  AND interval = 'month' 
  AND price = 499.00
RETURNING id, name, razorpay_plan_id;

-- Step 3: Update Pro Annual plan
-- Replace 'plan_xxxxx' with your actual Razorpay Plan ID from Dashboard
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_xxxxx', -- TODO: Replace with actual Plan ID
    updated_at = now()
WHERE name = 'Pro Annual' 
  AND interval = 'year' 
  AND price = 4790.00
RETURNING id, name, razorpay_plan_id;

-- Step 4: Update Enterprise Monthly plan
-- Replace 'plan_xxxxx' with your actual Razorpay Plan ID from Dashboard
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_xxxxx', -- TODO: Replace with actual Plan ID
    updated_at = now()
WHERE name = 'Enterprise' 
  AND interval = 'month' 
  AND price = 4999.00
RETURNING id, name, razorpay_plan_id;

-- Step 5: Update Enterprise Annual plan
-- Replace 'plan_xxxxx' with your actual Razorpay Plan ID from Dashboard
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_xxxxx', -- TODO: Replace with actual Plan ID
    updated_at = now()
WHERE name = 'Enterprise Annual' 
  AND interval = 'year' 
  AND price = 44999.00
RETURNING id, name, razorpay_plan_id;

-- Step 6: Verify all plans are configured correctly
SELECT 
  name,
  interval,
  price,
  razorpay_plan_id,
  CASE 
    WHEN razorpay_plan_id IS NULL AND name != 'Free' THEN '⚠️ Missing Razorpay Plan ID'
    WHEN razorpay_plan_id IS NOT NULL THEN '✅ Configured'
    ELSE '✅ Free Plan (No ID needed)'
  END as status
FROM subscription_plans
WHERE is_active = true
ORDER BY 
  CASE name 
    WHEN 'Free' THEN 1
    WHEN 'Pro' THEN 2
    WHEN 'Pro Annual' THEN 3
    WHEN 'Enterprise' THEN 4
    WHEN 'Enterprise Annual' THEN 5
  END,
  interval;










