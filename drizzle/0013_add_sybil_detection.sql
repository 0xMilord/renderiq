-- Sybil Detection Infrastructure
-- Tables for device fingerprinting, IP tracking, and sybil detection

-- Device fingerprints table
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  platform TEXT,
  hardware_concurrency INTEGER,
  device_memory INTEGER,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- IP addresses table
CREATE TABLE IF NOT EXISTS ip_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  ip_address TEXT NOT NULL,
  country TEXT,
  city TEXT,
  isp TEXT,
  is_proxy BOOLEAN DEFAULT false,
  is_vpn BOOLEAN DEFAULT false,
  is_tor BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMP DEFAULT now() NOT NULL,
  last_seen_at TIMESTAMP DEFAULT now() NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Sybil detections table
CREATE TABLE IF NOT EXISTS sybil_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  detection_reasons JSONB NOT NULL,
  linked_accounts JSONB,
  device_fingerprint_id UUID REFERENCES device_fingerprints(id),
  ip_address_id UUID REFERENCES ip_addresses(id),
  is_blocked BOOLEAN DEFAULT false NOT NULL,
  credits_awarded INTEGER DEFAULT 0 NOT NULL,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Account activity table
CREATE TABLE IF NOT EXISTS account_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'login', 'render', 'credit_purchase', 'logout')),
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint_id UUID REFERENCES device_fingerprints(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

-- Indexes for device_fingerprints
CREATE INDEX IF NOT EXISTS device_fingerprints_user_id_idx ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS device_fingerprints_hash_idx ON device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS device_fingerprints_created_at_idx ON device_fingerprints(created_at DESC);

-- Indexes for ip_addresses
CREATE INDEX IF NOT EXISTS ip_addresses_user_id_idx ON ip_addresses(user_id);
CREATE INDEX IF NOT EXISTS ip_addresses_ip_idx ON ip_addresses(ip_address);
CREATE INDEX IF NOT EXISTS ip_addresses_first_seen_idx ON ip_addresses(first_seen_at DESC);

-- Indexes for sybil_detections
CREATE INDEX IF NOT EXISTS sybil_detections_user_id_idx ON sybil_detections(user_id);
CREATE INDEX IF NOT EXISTS sybil_detections_risk_score_idx ON sybil_detections(risk_score DESC);
CREATE INDEX IF NOT EXISTS sybil_detections_risk_level_idx ON sybil_detections(risk_level);
CREATE INDEX IF NOT EXISTS sybil_detections_is_blocked_idx ON sybil_detections(is_blocked);
CREATE INDEX IF NOT EXISTS sybil_detections_created_at_idx ON sybil_detections(created_at DESC);

-- Indexes for account_activity
CREATE INDEX IF NOT EXISTS account_activity_user_id_idx ON account_activity(user_id);
CREATE INDEX IF NOT EXISTS account_activity_event_type_idx ON account_activity(event_type);
CREATE INDEX IF NOT EXISTS account_activity_ip_idx ON account_activity(ip_address);
CREATE INDEX IF NOT EXISTS account_activity_created_at_idx ON account_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS account_activity_user_event_idx ON account_activity(user_id, event_type, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS device_fingerprints_hash_user_idx ON device_fingerprints(fingerprint_hash, user_id);
CREATE INDEX IF NOT EXISTS ip_addresses_ip_user_idx ON ip_addresses(ip_address, user_id);
CREATE INDEX IF NOT EXISTS sybil_detections_user_blocked_idx ON sybil_detections(user_id, is_blocked);

