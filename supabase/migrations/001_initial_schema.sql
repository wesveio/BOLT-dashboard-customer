-- Enable extensions
-- Note: Supabase uses PostgreSQL which has gen_random_uuid() built-in (no extension needed)
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public;

-- Grant usage on schema public (ensures functions are accessible)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Enable TimescaleDB (if available)
-- CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Schema: customer
CREATE SCHEMA IF NOT EXISTS customer;

-- Schema: dashboard
CREATE SCHEMA IF NOT EXISTS dashboard;

-- Schema: analytics
CREATE SCHEMA IF NOT EXISTS analytics;

-- ============================================================================
-- CUSTOMER TABLES
-- ============================================================================

-- Customer accounts
CREATE TABLE customer.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vtex_account_name TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'basic', -- 'basic' | 'pro' | 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'suspended' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_plan_type CHECK (plan_type IN ('basic', 'pro', 'enterprise')),
  CONSTRAINT check_status CHECK (status IN ('active', 'suspended', 'cancelled'))
);

-- Dashboard users (passwordless auth)
CREATE TABLE dashboard.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'owner' | 'admin' | 'editor' | 'viewer'
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  CONSTRAINT check_role CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Auth codes (for passwordless authentication)
CREATE TABLE dashboard.auth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL, -- Hashed 6-digit code
  code_salt TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  CONSTRAINT auth_codes_expires_check CHECK (expires_at > created_at),
  CONSTRAINT check_auth_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT check_attempts_limit CHECK (attempts >= 0 AND attempts <= 10)
);

-- Dashboard sessions
CREATE TABLE dashboard.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES dashboard.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  CONSTRAINT check_token_not_empty CHECK (length(token) > 0 AND length(refresh_token) > 0),
  CONSTRAINT check_session_expires CHECK (refresh_expires_at > expires_at)
);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- Events table (time-series data)
CREATE TABLE analytics.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  order_form_id TEXT,
  customer_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  category TEXT NOT NULL, -- 'user_action' | 'api_call' | 'metric' | 'error'
  step TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_category CHECK (category IN ('user_action', 'api_call', 'metric', 'error'))
);

-- Create hypertable for time-series (requires TimescaleDB)
-- SELECT create_hypertable('analytics.events', 'timestamp');

-- Indexes for analytics.events
CREATE INDEX idx_events_customer_time ON analytics.events (customer_id, timestamp DESC);
CREATE INDEX idx_events_type_time ON analytics.events (event_type, timestamp DESC);
CREATE INDEX idx_events_session ON analytics.events (session_id);
CREATE INDEX idx_events_metadata ON analytics.events USING GIN (metadata);
CREATE INDEX idx_events_timestamp ON analytics.events (timestamp DESC);

-- ============================================================================
-- DASHBOARD TABLES
-- ============================================================================

-- Theme configurations
CREATE TABLE dashboard.theme_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  config JSONB NOT NULL, -- { colors, fonts, layout, etc }
  preview_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES dashboard.users(id)
);

-- Theme versions (versionamento)
CREATE TABLE dashboard.theme_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID REFERENCES dashboard.theme_configs(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES dashboard.users(id),
  CONSTRAINT unique_theme_version UNIQUE (theme_id, version_number),
  CONSTRAINT check_version_positive CHECK (version_number > 0)
);

-- Financial metrics
CREATE TABLE dashboard.financial_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  mrr NUMERIC(12, 2),
  arr NUMERIC(12, 2),
  total_revenue NUMERIC(12, 2),
  churn_rate NUMERIC(5, 2),
  ltv NUMERIC(12, 2),
  cac NUMERIC(12, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, period_start, period_end),
  CONSTRAINT check_period_valid CHECK (period_end >= period_start)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Customer indexes
CREATE INDEX idx_users_account_id ON dashboard.users (account_id);
CREATE INDEX idx_users_email ON dashboard.users (email);

-- Auth indexes
CREATE INDEX idx_auth_codes_email ON dashboard.auth_codes (email, created_at DESC);
CREATE INDEX idx_auth_codes_expires ON dashboard.auth_codes (expires_at) WHERE used = false;
CREATE INDEX idx_sessions_user_id ON dashboard.sessions (user_id);
CREATE INDEX idx_sessions_token ON dashboard.sessions (token);
CREATE INDEX idx_sessions_expires ON dashboard.sessions (expires_at);

-- Theme indexes
CREATE INDEX idx_theme_configs_account ON dashboard.theme_configs (account_id);
CREATE INDEX idx_theme_configs_active ON dashboard.theme_configs (account_id, is_active) WHERE is_active = true;
CREATE INDEX idx_theme_versions_theme ON dashboard.theme_versions (theme_id);
CREATE INDEX idx_theme_versions_latest ON dashboard.theme_versions (theme_id, version_number DESC);

-- Financial indexes
CREATE INDEX idx_financial_metrics_account ON dashboard.financial_metrics (account_id, period_start DESC);
CREATE INDEX idx_financial_metrics_period ON dashboard.financial_metrics (account_id, period_start, period_end);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION dashboard.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON customer.accounts
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON dashboard.users
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

CREATE TRIGGER update_theme_configs_updated_at
  BEFORE UPDATE ON dashboard.theme_configs
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

-- ============================================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite index for events queries (customer + category + timestamp)
CREATE INDEX idx_events_customer_category_time ON analytics.events (customer_id, category, timestamp DESC) WHERE customer_id IS NOT NULL;

-- Index for order_form_id lookups
CREATE INDEX idx_events_order_form ON analytics.events (order_form_id) WHERE order_form_id IS NOT NULL;

