-- Update Razorpay Plan IDs in subscription_plans table
-- Plan IDs from Razorpay Dashboard (created on 03 Dec 2025)

-- Update Pro Monthly plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_Rn3lmBVjGI02dN',
    updated_at = now()
WHERE name = 'Pro' 
  AND interval = 'month' 
  AND price = 499.00
RETURNING id, name, interval, price, razorpay_plan_id;

-- Update Pro Annual plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_Rn3moB87xZ4vB8',
    updated_at = now()
WHERE name = 'Pro Annual' 
  AND interval = 'year' 
  AND price = 4790.00
RETURNING id, name, interval, price, razorpay_plan_id;

-- Update Enterprise Monthly plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_Rn3nUhCt7lZnrQ',
    updated_at = now()
WHERE name = 'Enterprise' 
  AND interval = 'month' 
  AND price = 4999.00
RETURNING id, name, interval, price, razorpay_plan_id;

-- Update Enterprise Annual plan
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_Rn3oMq9i8HeGl4',
    updated_at = now()
WHERE name = 'Enterprise Annual' 
  AND interval = 'year' 
  AND price = 44999.00
RETURNING id, name, interval, price, razorpay_plan_id;

-- Verify all plans are configured correctly
SELECT 
  name,
  interval,
  price,
  currency,
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










