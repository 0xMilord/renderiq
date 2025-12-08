-- Ambassador/Affiliate System Infrastructure
-- Tables for ambassador program, referrals, commissions, and payouts

-- Ambassadors table
CREATE TABLE IF NOT EXISTS ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'suspended')),
  discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 25.00,
  commission_duration_months INTEGER NOT NULL DEFAULT 6,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  paid_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  application_data JSONB,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejected_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_ambassadors_user_id ON ambassadors(user_id);
CREATE INDEX idx_ambassadors_code ON ambassadors(code);
CREATE INDEX idx_ambassadors_status ON ambassadors(status);

-- Ambassador links table
CREATE TABLE IF NOT EXISTS ambassador_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID REFERENCES ambassadors(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  url TEXT NOT NULL,
  campaign_name TEXT,
  description TEXT,
  click_count INTEGER NOT NULL DEFAULT 0,
  signup_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL,
  UNIQUE(ambassador_id, code)
);

CREATE INDEX idx_ambassador_links_ambassador_id ON ambassador_links(ambassador_id);
CREATE INDEX idx_ambassador_links_code ON ambassador_links(code);

-- Ambassador referrals table
CREATE TABLE IF NOT EXISTS ambassador_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID REFERENCES ambassadors(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  link_id UUID REFERENCES ambassador_links(id),
  referral_code TEXT NOT NULL,
  signup_at TIMESTAMP DEFAULT now() NOT NULL,
  first_subscription_at TIMESTAMP,
  subscription_id UUID REFERENCES user_subscriptions(id),
  total_commission_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_months_remaining INTEGER NOT NULL DEFAULT 6,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL,
  UNIQUE(ambassador_id, referred_user_id)
);

CREATE INDEX idx_ambassador_referrals_ambassador_id ON ambassador_referrals(ambassador_id);
CREATE INDEX idx_ambassador_referrals_referred_user_id ON ambassador_referrals(referred_user_id);
CREATE INDEX idx_ambassador_referrals_status ON ambassador_referrals(status);

-- Ambassador payouts table (created before commissions to avoid circular reference)
CREATE TABLE IF NOT EXISTS ambassador_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID REFERENCES ambassadors(id) ON DELETE CASCADE NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_commissions DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMP,
  paid_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_ambassador_payouts_ambassador_id ON ambassador_payouts(ambassador_id);
CREATE INDEX idx_ambassador_payouts_status ON ambassador_payouts(status);
CREATE INDEX idx_ambassador_payouts_period ON ambassador_payouts(period_start, period_end);

-- Ambassador commissions table
CREATE TABLE IF NOT EXISTS ambassador_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID REFERENCES ambassadors(id) ON DELETE CASCADE NOT NULL,
  referral_id UUID REFERENCES ambassador_referrals(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE NOT NULL,
  payment_order_id UUID REFERENCES payment_orders(id),
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  subscription_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payout_period_id UUID REFERENCES ambassador_payouts(id),
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_ambassador_commissions_ambassador_id ON ambassador_commissions(ambassador_id);
CREATE INDEX idx_ambassador_commissions_referral_id ON ambassador_commissions(referral_id);
CREATE INDEX idx_ambassador_commissions_status ON ambassador_commissions(status);
CREATE INDEX idx_ambassador_commissions_payout_period_id ON ambassador_commissions(payout_period_id);

-- Ambassador volume tiers table
CREATE TABLE IF NOT EXISTS ambassador_volume_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  min_referrals INTEGER NOT NULL,
  discount_percentage DECIMAL(5,2) NOT NULL,
  commission_percentage DECIMAL(5,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Insert default volume tiers
INSERT INTO ambassador_volume_tiers (tier_name, min_referrals, discount_percentage, commission_percentage, is_active) VALUES
  ('Bronze', 0, 20.00, 25.00, true),
  ('Silver', 10, 25.00, 25.00, true),
  ('Gold', 50, 30.00, 25.00, true),
  ('Platinum', 100, 35.00, 25.00, true)
ON CONFLICT (tier_name) DO NOTHING;

