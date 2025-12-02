-- Migration: Add subscription plans
-- Description: Insert subscription plans with 5 INR per credit pricing
-- Pricing: 1 credit = 5 INR

INSERT INTO subscription_plans (id, name, description, price, currency, interval, credits_per_month, max_projects, max_renders_per_project, features, razorpay_plan_id, is_active, created_at, updated_at)
VALUES
  -- Free Plan - Monthly: 10 credits/month for free
  (gen_random_uuid(), 'Free', 'Perfect for getting started', 0.00, 'INR', 'month', 10, 3, 5, 
   '["10 credits per month", "3 projects maximum", "5 renders per project", "Standard quality", "Community support"]'::jsonb, 
   NULL, true, now(), now()),
  
  -- Pro Plan - Monthly: 100 credits/month for 499 INR (matches Starter Pack one-time)
  (gen_random_uuid(), 'Pro', 'Perfect for regular creators', 499.00, 'INR', 'month', 100, NULL, NULL, 
   '["100 credits per month", "Unlimited projects", "Unlimited renders", "High quality", "Priority support", "Video generation", "API access"]'::jsonb, 
   NULL, true, now(), now()),
  
  -- Pro Plan - Annual: 100 credits/month for 4790 INR (20% discount, ~2 months free)
  (gen_random_uuid(), 'Pro Annual', 'Best value for regular creators', 4790.00, 'INR', 'year', 100, NULL, NULL, 
   '["100 credits per month", "Unlimited projects", "Unlimited renders", "High quality", "Priority support", "Video generation", "API access", "20% savings"]'::jsonb, 
   NULL, true, now(), now()),
  
  -- Enterprise Plan - Monthly: 1000 credits/month for 4999 INR
  (gen_random_uuid(), 'Enterprise', 'For professional studios', 4999.00, 'INR', 'month', 1000, NULL, NULL, 
   '["1000 credits per month", "Unlimited projects", "Unlimited renders", "Ultra quality", "Dedicated support", "Team collaboration", "Full API access", "Custom integrations", "SLA guarantee"]'::jsonb, 
   NULL, true, now(), now()),
  
  -- Enterprise Plan - Annual: 1000 credits/month for 44999 INR (25% discount, ~3 months free)
  (gen_random_uuid(), 'Enterprise Annual', 'Best value for professional studios', 44999.00, 'INR', 'year', 1000, NULL, NULL, 
   '["1000 credits per month", "Unlimited projects", "Unlimited renders", "Ultra quality", "Dedicated support", "Team collaboration", "Full API access", "Custom integrations", "SLA guarantee", "25% savings"]'::jsonb, 
   NULL, true, now(), now())
ON CONFLICT DO NOTHING;
