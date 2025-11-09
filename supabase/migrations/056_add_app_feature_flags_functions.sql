-- ============================================================================
-- App Feature Flags Functions
-- ============================================================================
-- RPC functions to manage app feature flags

-- Function to get app feature flags for an account
CREATE OR REPLACE FUNCTION public.get_app_feature_flags(
  p_account_id UUID
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  event_tracking_enabled BOOLEAN,
  bolt_plugin_enabled BOOLEAN,
  console_plugin_enabled BOOLEAN,
  logging_enabled BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.account_id,
    f.event_tracking_enabled,
    f.bolt_plugin_enabled,
    f.console_plugin_enabled,
    f.logging_enabled,
    f.created_at,
    f.updated_at
  FROM dashboard.app_feature_flags f
  WHERE f.account_id = p_account_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert app feature flags
CREATE OR REPLACE FUNCTION public.upsert_app_feature_flags(
  p_account_id UUID,
  p_event_tracking_enabled BOOLEAN DEFAULT NULL,
  p_bolt_plugin_enabled BOOLEAN DEFAULT NULL,
  p_console_plugin_enabled BOOLEAN DEFAULT NULL,
  p_logging_enabled BOOLEAN DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_flag_id UUID;
BEGIN
  INSERT INTO dashboard.app_feature_flags (
    account_id,
    event_tracking_enabled,
    bolt_plugin_enabled,
    console_plugin_enabled,
    logging_enabled,
    updated_at
  )
  VALUES (
    p_account_id,
    COALESCE(p_event_tracking_enabled, true),
    COALESCE(p_bolt_plugin_enabled, true),
    COALESCE(p_console_plugin_enabled, true),
    COALESCE(p_logging_enabled, true),
    NOW()
  )
  ON CONFLICT (account_id) DO UPDATE SET
    event_tracking_enabled = COALESCE(p_event_tracking_enabled, app_feature_flags.event_tracking_enabled),
    bolt_plugin_enabled = COALESCE(p_bolt_plugin_enabled, app_feature_flags.bolt_plugin_enabled),
    console_plugin_enabled = COALESCE(p_console_plugin_enabled, app_feature_flags.console_plugin_enabled),
    logging_enabled = COALESCE(p_logging_enabled, app_feature_flags.logging_enabled),
    updated_at = NOW()
  RETURNING id INTO v_flag_id;
  
  RETURN v_flag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION public.get_app_feature_flags IS 'Retrieve app feature flags for a customer account';
COMMENT ON FUNCTION public.upsert_app_feature_flags IS 'Create or update app feature flags for a customer account';

