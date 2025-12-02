-- Migration: Update pricing to 5 INR per credit
-- Based on: 499 INR gets 100 credits, each credit = 5 INR

-- Update subscription plans to reflect 5 INR per credit pricing
UPDATE subscription_plans 
SET 
  price = '4999.00',
  updated_at = NOW()
WHERE name = 'Enterprise' AND interval = 'month';

UPDATE subscription_plans 
SET 
  price = '44999.00',
  updated_at = NOW()
WHERE name = 'Enterprise Annual' AND interval = 'year';

-- Update credit packages to reflect 5 INR per credit pricing
-- Starter Pack: 50 credits × 5 INR = 250 INR
UPDATE credit_packages 
SET 
  price = '250.00',
  bonus_credits = 0,
  updated_at = NOW()
WHERE name = 'Starter Pack';

-- Professional Pack: 100 credits × 5 INR = 500 INR, offering at 499 INR
UPDATE credit_packages 
SET 
  credits = 100,
  price = '499.00',
  bonus_credits = 0,
  description = 'Best value for regular users (matches Pro subscription)',
  updated_at = NOW()
WHERE name = 'Professional Pack';

-- Power Pack: 500 credits × 5 INR = 2500 INR, offering at 2499 INR
UPDATE credit_packages 
SET 
  price = '2499.00',
  bonus_credits = 0,
  updated_at = NOW()
WHERE name = 'Power Pack';

-- Enterprise Pack: 1000 credits × 5 INR = 5000 INR, offering at 4999 INR
UPDATE credit_packages 
SET 
  price = '4999.00',
  bonus_credits = 0,
  updated_at = NOW()
WHERE name = 'Enterprise Pack';

-- Add comment for reference
COMMENT ON TABLE credit_packages IS 'Credit packages priced at 5 INR per credit. Base pricing: credits × 5 INR.';
COMMENT ON TABLE subscription_plans IS 'Subscription plans: Pro plan offers 499 INR for 100 credits (5 INR per credit). Enterprise plans follow same pricing model.';

