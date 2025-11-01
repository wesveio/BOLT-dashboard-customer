-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vtex_account_name TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'basic', -- 'basic' | 'pro' | 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'suspended' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard users (passwordless auth)
CREATE TABLE dashboard.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_id UUID REFERENCES dashboard.theme_configs(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES dashboard.users(id)
);

-- Financial metrics
CREATE TABLE dashboard.financial_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

