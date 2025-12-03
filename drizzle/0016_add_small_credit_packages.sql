-- Migration: Add small credit packages
-- Description: Add 1 credit, 10 credit, and 50 credit packages for smaller purchases
-- Pricing: 5 INR per credit

-- Add new small packages
-- Note: If Starter Pack already exists, it will be updated; otherwise a new one will be created
INSERT INTO credit_packages (id, name, description, credits, price, currency, bonus_credits, is_popular, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Single Credit',
  'Try it out with 1 credit',
  1,
  5.00,
  'INR',
  0,
  false,
  true,
  0,
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM credit_packages WHERE name = 'Single Credit');

INSERT INTO credit_packages (id, name, description, credits, price, currency, bonus_credits, is_popular, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Mini Pack',
  'Small starter package',
  10,
  50.00,
  'INR',
  0,
  false,
  true,
  1,
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM credit_packages WHERE name = 'Mini Pack');

-- Update or insert Starter Pack (50 credits)
-- First try to update existing Starter Pack, if it exists
UPDATE credit_packages
SET 
  credits = 50,
  price = 250.00,
  description = 'Perfect for trying out',
  display_order = 2,
  updated_at = now()
WHERE name = 'Starter Pack';

-- If Starter Pack doesn't exist, insert it
INSERT INTO credit_packages (id, name, description, credits, price, currency, bonus_credits, is_popular, is_active, display_order, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Starter Pack',
  'Perfect for trying out',
  50,
  250.00,
  'INR',
  0,
  false,
  true,
  2,
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM credit_packages WHERE name = 'Starter Pack');

-- Update display_order for existing packages to make room for new ones
-- Shift all existing packages by 3 positions (except the ones we just added/updated)
UPDATE credit_packages 
SET display_order = display_order + 3,
    updated_at = now()
WHERE name NOT IN ('Single Credit', 'Mini Pack', 'Starter Pack')
  AND display_order >= 0;

