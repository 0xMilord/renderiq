-- Migration: Implement Volume-Based Pricing Strategy
-- Description: Update credit packages to use tiered pricing model
-- Pricing Tiers:
--   - Single credit: ₹10 per credit
--   - Standard: ₹5 per credit (default)
--   - Bulk (≥ ₹2.5L): ₹2 per credit

-- Step 1: Add new columns for pricing tier support
ALTER TABLE credit_packages 
ADD COLUMN IF NOT EXISTS pricing_tier VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS price_per_credit DECIMAL(10, 2) NOT NULL DEFAULT 5.00;

-- Step 2: Delete all existing credit packages
DELETE FROM credit_packages;

-- Step 3: Insert packages according to volume-based pricing strategy

-- Single Credit Package (Entry Tier)
INSERT INTO credit_packages (id, name, description, credits, price, currency, bonus_credits, is_popular, is_active, display_order, pricing_tier, price_per_credit, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Single Credit', 'Try it out with 1 credit', 1, 10.00, 'INR', 0, false, true, 1, 'single', 10.00, now(), now());

-- Starter Packages (Standard Tier - ₹5 per credit)
INSERT INTO credit_packages (id, name, description, credits, price, currency, bonus_credits, is_popular, is_active, display_order, pricing_tier, price_per_credit, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Starter Pack', 'Perfect for trying out Renderiq', 100, 500.00, 'INR', 0, false, true, 2, 'standard', 5.00, now(), now()),
  (gen_random_uuid(), 'Popular Pack', 'Great value for regular users', 500, 2500.00, 'INR', 0, true, true, 3, 'standard', 5.00, now(), now()),
  (gen_random_uuid(), 'Pro Pack', 'For professional creators', 1000, 5000.00, 'INR', 0, false, true, 4, 'standard', 5.00, now(), now());

-- Value Packages (Standard Tier - ₹5 per credit)
INSERT INTO credit_packages (id, name, description, credits, price, currency, bonus_credits, is_popular, is_active, display_order, pricing_tier, price_per_credit, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Studio Pack', 'For studios and teams', 5000, 25000.00, 'INR', 0, false, true, 5, 'standard', 5.00, now(), now()),
  (gen_random_uuid(), 'Enterprise Pack', 'For large-scale operations', 10000, 50000.00, 'INR', 0, false, true, 6, 'standard', 5.00, now(), now()),
  (gen_random_uuid(), 'Mega Pack', 'Maximum credits package', 25000, 125000.00, 'INR', 0, false, true, 7, 'standard', 5.00, now(), now());

-- Bulk Packages (Discount Tier - ₹2 per credit, minimum ₹2.5L)
INSERT INTO credit_packages (id, name, description, credits, price, currency, bonus_credits, is_popular, is_active, display_order, pricing_tier, price_per_credit, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Ultra Pack', 'Best value for enterprise - 60% savings!', 125000, 250000.00, 'INR', 0, false, true, 8, 'bulk', 2.00, now(), now()),
  (gen_random_uuid(), 'Maximum Pack', 'Maximum value package - Enterprise bulk pricing', 250000, 500000.00, 'INR', 0, false, true, 9, 'bulk', 2.00, now(), now()),
  (gen_random_uuid(), 'Enterprise Bulk', 'For large enterprises - Maximum savings', 500000, 1000000.00, 'INR', 0, false, true, 10, 'bulk', 2.00, now(), now());

-- Add comments for documentation
COMMENT ON COLUMN credit_packages.pricing_tier IS 'Pricing tier: single (₹10/credit), standard (₹5/credit), or bulk (₹2/credit)';
COMMENT ON COLUMN credit_packages.price_per_credit IS 'Price per credit in the base currency (INR)';
COMMENT ON TABLE credit_packages IS 'Credit packages with volume-based pricing: Single (₹10), Standard (₹5), Bulk ≥₹2.5L (₹2)';

