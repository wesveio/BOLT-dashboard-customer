-- ============================================================================
-- App Feature Flags Schema
-- ============================================================================
-- Stores application-level feature flags per customer account
-- These flags control event tracking, plugins, and logging features

-- ============================================================================
-- App Feature Flags Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard.app_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES customer.accounts(id) ON DELETE CASCADE,
  event_tracking_enabled BOOLEAN DEFAULT true,
  bolt_plugin_enabled BOOLEAN DEFAULT true,
  console_plugin_enabled BOOLEAN DEFAULT true,
  logging_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_app_feature_flags_account_id ON dashboard.app_feature_flags(account_id);

-- Grant permissions for service_role to access the table
GRANT ALL ON dashboard.app_feature_flags TO service_role, postgres;

-- Comments
COMMENT ON TABLE dashboard.app_feature_flags IS 'Application-level feature flags per customer account';
COMMENT ON COLUMN dashboard.app_feature_flags.event_tracking_enabled IS 'Enable/disable event tracking system';
COMMENT ON COLUMN dashboard.app_feature_flags.bolt_plugin_enabled IS 'Enable/disable Bolt metrics plugin';
COMMENT ON COLUMN dashboard.app_feature_flags.console_plugin_enabled IS 'Enable/disable console logging plugin';
COMMENT ON COLUMN dashboard.app_feature_flags.logging_enabled IS 'Enable/disable application logging';

