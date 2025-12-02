-- Migration: Add credit packages
-- Description: Insert credit packages with pricing 499, 1499, and 4599 INR
-- Packages range from 50 to 50000 credits

INSERT INTO credit_packages (id, name, description, credits, price, currency, bonus_credits, is_popular, is_active, display_order, created_at, updated_at)
VALUES
  -- Starter Package - 50 credits for 499 INR
  (gen_random_uuid(), 'Starter Pack', 'Perfect for trying out RenderIQ', 50, 499.00, 'INR', 0, false, true, 1, now(), now()),
  
  -- Popular Package - 150 credits for 1499 INR
  (gen_random_uuid(), 'Popular Pack', 'Great value for regular users', 150, 1499.00, 'INR', 0, true, true, 2, now(), now()),
  
  -- Value Package - 500 credits for 4599 INR
  (gen_random_uuid(), 'Value Pack', 'Best value for power users', 500, 4599.00, 'INR', 0, false, true, 3, now(), now()),
  
  -- Additional tiers up to 50000 credits
  (gen_random_uuid(), 'Pro Pack', 'For professional creators', 1000, 8999.00, 'INR', 0, false, true, 4, now(), now()),
  
  (gen_random_uuid(), 'Studio Pack', 'For studios and teams', 2500, 19999.00, 'INR', 0, false, true, 5, now(), now()),
  
  (gen_random_uuid(), 'Enterprise Pack', 'For large-scale operations', 5000, 39999.00, 'INR', 0, false, true, 6, now(), now()),
  
  (gen_random_uuid(), 'Mega Pack', 'Maximum credits package', 10000, 79999.00, 'INR', 0, false, true, 7, now(), now()),
  
  (gen_random_uuid(), 'Ultra Pack', 'For enterprise needs', 25000, 199999.00, 'INR', 0, false, true, 8, now(), now()),
  
  (gen_random_uuid(), 'Maximum Pack', 'Maximum value package', 50000, 399999.00, 'INR', 0, false, true, 9, now(), now())
ON CONFLICT DO NOTHING;

