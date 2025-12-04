-- Migration: Add Starter Plan at ₹119
-- Description: Add new subscription plan with 24 credits/month for ₹119
-- Pricing: 119 INR / 5 INR per credit = 23.8 credits, rounded to 24 credits
-- Positioned between Free (10 credits) and Pro (100 credits)

INSERT INTO subscription_plans (id, name, description, price, currency, interval, credits_per_month, max_projects, max_renders_per_project, features, razorpay_plan_id, is_active, created_at, updated_at)
VALUES
  -- Starter Plan - Monthly: 24 credits/month for 119 INR
  (gen_random_uuid(), 'Starter', 'Great for casual creators', 119.00, 'INR', 'month', 24, 10, 10, 
   '["24 credits per month", "10 projects maximum", "10 renders per project", "Standard quality", "Community support", "Public gallery access"]'::jsonb, 
   NULL, true, now(), now())
ON CONFLICT DO NOTHING;



