-- ============================================================================
-- MIGRAÇÕES CONSOLIDADAS - Dashboard Customer
-- ============================================================================
-- Este arquivo contém todas as migrações na ordem correta.
-- Execute este arquivo completo no SQL Editor do Supabase Dashboard.
-- ============================================================================
-- Gerado em: 2025-11-01T19:02:32.694Z
-- Total de migrações: 5
-- ============================================================================


-- ============================================================================
-- MIGRATION 1/5: 001_initial_schema.sql
-- ============================================================================

-- Enable UUID extension (explicitly in public schema)
-- Note: Supabase uses PostgreSQL which has gen_random_uuid() built-in,
-- but uuid-ossp provides uuid_generate_v4() for compatibility
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
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
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  vtex_account_name TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'basic', -- 'basic' | 'pro' | 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'suspended' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard users (passwordless auth)
CREATE TABLE dashboard.users (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  account_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'owner' | 'admin' | 'editor' | 'viewer'
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Auth codes (for passwordless authentication)
CREATE TABLE dashboard.auth_codes (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL, -- Hashed 6-digit code
  code_salt TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  CONSTRAINT auth_codes_expires_check CHECK (expires_at > created_at)
);

-- Dashboard sessions
CREATE TABLE dashboard.sessions (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  user_id UUID REFERENCES dashboard.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- Events table (time-series data)
CREATE TABLE analytics.events (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  session_id TEXT NOT NULL,
  order_form_id TEXT,
  customer_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  category TEXT NOT NULL, -- 'user_action' | 'api_call' | 'metric' | 'error'
  step TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  theme_id UUID REFERENCES dashboard.theme_configs(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES dashboard.users(id)
);

-- Financial metrics
CREATE TABLE dashboard.financial_metrics (
  id UUID PRIMARY KEY DEFAULT public.uuid_generate_v4(),
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
  UNIQUE(account_id, period_start, period_end)
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
CREATE INDEX idx_theme_versions_theme ON dashboard.theme_versions (theme_id);

-- Financial indexes
CREATE INDEX idx_financial_metrics_account ON dashboard.financial_metrics (account_id, period_start DESC);




-- ============================================================================
-- MIGRATION 2/5: 002_rls_policies.sql
-- ============================================================================

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE customer.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.theme_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.theme_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Get current user's account_id
-- ============================================================================

CREATE OR REPLACE FUNCTION dashboard.get_user_account_id(user_id UUID)
RETURNS UUID AS $$
  SELECT account_id FROM dashboard.users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- CUSTOMER.ACCOUNTS POLICIES
-- ============================================================================

-- Users can only see their own account
CREATE POLICY "Users can view their account"
  ON customer.accounts
  FOR SELECT
  USING (
    id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- ============================================================================
-- DASHBOARD.USERS POLICIES
-- ============================================================================

-- Users can view users from their account
CREATE POLICY "Users can view account users"
  ON dashboard.users
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Only owners and admins can insert new users
CREATE POLICY "Owners and admins can create users"
  ON dashboard.users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('owner', 'admin')
      AND account_id = dashboard.users.account_id
    )
  );

-- Owners can update any user, admins can only update non-owners
CREATE POLICY "Owners and admins can update users"
  ON dashboard.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard.users current_user
      WHERE current_user.id = auth.uid()::UUID
      AND (
        (current_user.role = 'owner')
        OR (current_user.role = 'admin' AND dashboard.users.role != 'owner')
      )
      AND current_user.account_id = dashboard.users.account_id
    )
  );

-- Only owners can delete users
CREATE POLICY "Only owners can delete users"
  ON dashboard.users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role = 'owner'
      AND account_id = dashboard.users.account_id
    )
  );

-- ============================================================================
-- ANALYTICS.EVENTS POLICIES
-- ============================================================================

-- Customers can only see their own events
CREATE POLICY "Customers can view their events"
  ON analytics.events
  FOR SELECT
  USING (
    customer_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- ============================================================================
-- DASHBOARD.THEME_CONFIGS POLICIES
-- ============================================================================

-- Users can view themes from their account
CREATE POLICY "Users can view account themes"
  ON dashboard.theme_configs
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Editors, admins, and owners can create themes
CREATE POLICY "Editors+ can create themes"
  ON dashboard.theme_configs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('editor', 'admin', 'owner')
      AND account_id = dashboard.theme_configs.account_id
    )
  );

-- Editors, admins, and owners can update themes
CREATE POLICY "Editors+ can update themes"
  ON dashboard.theme_configs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('editor', 'admin', 'owner')
      AND account_id = dashboard.theme_configs.account_id
    )
  );

-- Admins and owners can delete themes
CREATE POLICY "Admins+ can delete themes"
  ON dashboard.theme_configs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('admin', 'owner')
      AND account_id = dashboard.theme_configs.account_id
    )
  );

-- ============================================================================
-- DASHBOARD.FINANCIAL_METRICS POLICIES
-- ============================================================================

-- Users can view financial metrics from their account
CREATE POLICY "Users can view account financial metrics"
  ON dashboard.financial_metrics
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Only system (service role) can insert/update financial metrics
-- (No policy needed as RLS is enforced, service role bypasses RLS)




-- ============================================================================
-- MIGRATION 3/5: 003_materialized_views.sql
-- ============================================================================

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- Hourly checkout metrics
CREATE MATERIALIZED VIEW analytics.checkout_metrics_hourly AS
SELECT
  customer_id,
  time_bucket('1 hour', timestamp) AS hour,
  COUNT(DISTINCT session_id) AS total_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'order_confirmed' THEN session_id END) AS completed_checkouts,
  COUNT(DISTINCT CASE WHEN event_type = 'step_abandoned' THEN session_id END) AS abandoned_checkouts,
  AVG((metadata->>'duration')::numeric) AS avg_duration,
  SUM((metadata->>'cartValue')::numeric) AS total_revenue,
  AVG((metadata->>'cartValue')::numeric) AS avg_cart_value,
  COUNT(DISTINCT CASE WHEN category = 'error' THEN session_id END) AS error_sessions
FROM analytics.events
WHERE category IN ('metric', 'user_action')
GROUP BY customer_id, time_bucket('1 hour', timestamp);

-- Create unique index for refresh
CREATE UNIQUE INDEX idx_checkout_metrics_hourly_unique
ON analytics.checkout_metrics_hourly (customer_id, hour);

-- Daily checkout metrics
CREATE MATERIALIZED VIEW analytics.checkout_metrics_daily AS
SELECT
  customer_id,
  DATE(timestamp) AS date,
  COUNT(DISTINCT session_id) AS total_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'order_confirmed' THEN session_id END) AS completed_checkouts,
  COUNT(DISTINCT CASE WHEN event_type = 'step_abandoned' THEN session_id END) AS abandoned_checkouts,
  AVG((metadata->>'duration')::numeric) AS avg_duration,
  SUM((metadata->>'cartValue')::numeric) AS total_revenue,
  AVG((metadata->>'cartValue')::numeric) AS avg_cart_value,
  COUNT(DISTINCT order_form_id) AS unique_orders
FROM analytics.events
WHERE category IN ('metric', 'user_action')
GROUP BY customer_id, DATE(timestamp);

-- Create unique index for refresh
CREATE UNIQUE INDEX idx_checkout_metrics_daily_unique
ON analytics.checkout_metrics_daily (customer_id, date);

-- Funnel metrics by step
CREATE MATERIALIZED VIEW analytics.checkout_funnel AS
SELECT
  customer_id,
  DATE(timestamp) AS date,
  COUNT(DISTINCT CASE WHEN event_type = 'checkout_started' THEN session_id END) AS started,
  COUNT(DISTINCT CASE WHEN event_type = 'step_completed' AND step = 'cart' THEN session_id END) AS cart_completed,
  COUNT(DISTINCT CASE WHEN event_type = 'step_completed' AND step = 'profile' THEN session_id END) AS profile_completed,
  COUNT(DISTINCT CASE WHEN event_type = 'step_completed' AND step = 'shipping' THEN session_id END) AS shipping_completed,
  COUNT(DISTINCT CASE WHEN event_type = 'step_completed' AND step = 'payment' THEN session_id END) AS payment_completed,
  COUNT(DISTINCT CASE WHEN event_type = 'order_confirmed' THEN session_id END) AS confirmed
FROM analytics.events
WHERE category = 'user_action'
GROUP BY customer_id, DATE(timestamp);

-- Create unique index for refresh
CREATE UNIQUE INDEX idx_checkout_funnel_unique
ON analytics.checkout_funnel (customer_id, date);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION analytics.refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.checkout_metrics_hourly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.checkout_metrics_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.checkout_funnel;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-analytics', '0 * * * *', 'SELECT analytics.refresh_materialized_views()');




-- ============================================================================
-- MIGRATION 4/5: 004_auth_tables.sql
-- ============================================================================

-- ============================================================================
-- ADDITIONAL INDEXES FOR AUTH PERFORMANCE
-- ============================================================================

-- Index for rate limiting checks on auth_codes
CREATE INDEX idx_auth_codes_rate_limit
ON dashboard.auth_codes (email, created_at DESC)
WHERE used = false AND expires_at > NOW();

-- Index for session cleanup
CREATE INDEX idx_sessions_cleanup
ON dashboard.sessions (expires_at)
WHERE expires_at < NOW();

-- ============================================================================
-- FUNCTIONS FOR AUTH
-- ============================================================================

-- Function to clean expired auth codes (runs automatically via trigger)
CREATE OR REPLACE FUNCTION dashboard.cleanup_expired_auth_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM dashboard.auth_codes
  WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION dashboard.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM dashboard.sessions
  WHERE expires_at < NOW() OR refresh_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit for auth codes
CREATE OR REPLACE FUNCTION dashboard.check_auth_code_rate_limit(
  p_email TEXT,
  p_limit_hours INTEGER DEFAULT 1,
  p_max_codes INTEGER DEFAULT 3
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM dashboard.auth_codes
  WHERE email = p_email
    AND created_at > NOW() - (p_limit_hours || ' hours')::INTERVAL
    AND used = false;

  RETURN v_count < p_max_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




-- ============================================================================
-- MIGRATION 5/5: 005_add_user_fields.sql
-- ============================================================================

-- ============================================================================
-- ADD USER PROFILE FIELDS AND SETTINGS
-- ============================================================================

-- Add profile fields to dashboard.users
ALTER TABLE dashboard.users
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add account_id to analytics.events (alias for customer_id, but more semantic)
-- Note: customer_id already exists, but we'll create an index for account_id queries
CREATE INDEX IF NOT EXISTS idx_events_account_id ON analytics.events (customer_id, timestamp DESC);

-- Rename last_login_at to last_login for consistency
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'dashboard' 
             AND table_name = 'users' 
             AND column_name = 'last_login_at') THEN
    ALTER TABLE dashboard.users RENAME COLUMN last_login_at TO last_login;
  END IF;
END $$;



-- ============================================================================
-- FIM DAS MIGRAÇÕES
-- ============================================================================
-- Próximos passos:
-- 1. Verifique se todas as tabelas foram criadas
-- 2. Verifique as políticas RLS
-- 3. Teste a conexão com a aplicação
-- ============================================================================
