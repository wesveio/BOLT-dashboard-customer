-- ============================================================================
-- Migration: Onboarding Tracking
-- ============================================================================
-- Creates table and functions to track onboarding status for accounts
-- Onboarding is triggered when a subscription is activated
-- ============================================================================

-- ============================================================================
-- ONBOARDING STATUS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard.onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription_id UUID REFERENCES dashboard.subscriptions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'pending', 'in_progress', 'completed', 'failed'
  steps_completed JSONB DEFAULT '[]'::jsonb, -- Array of completed step IDs
  errors JSONB DEFAULT '[]'::jsonb, -- Array of error messages
  triggered_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_onboarding_status CHECK (status IN ('not_started', 'pending', 'in_progress', 'completed', 'failed'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_status_account ON dashboard.onboarding_status(account_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status_status ON dashboard.onboarding_status(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_status_subscription ON dashboard.onboarding_status(subscription_id);

-- Trigger for updated_at
CREATE TRIGGER update_onboarding_status_updated_at
  BEFORE UPDATE ON dashboard.onboarding_status
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE dashboard.onboarding_status ENABLE ROW LEVEL SECURITY;

-- Users can view onboarding status for their account
CREATE POLICY "Users can view account onboarding status"
  ON dashboard.onboarding_status
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Service role can manage onboarding status (for automation)
-- Note: This is managed by service_role, not by users directly

-- ============================================================================
-- PUBLIC FUNCTIONS FOR ONBOARDING
-- ============================================================================

-- Create onboarding status record
CREATE OR REPLACE FUNCTION public.create_onboarding_status(
  p_account_id UUID,
  p_subscription_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_onboarding_id UUID;
BEGIN
  INSERT INTO dashboard.onboarding_status (
    account_id,
    subscription_id,
    status,
    triggered_at,
    started_at
  )
  VALUES (
    p_account_id,
    p_subscription_id,
    'in_progress',
    NOW(),
    NOW()
  )
  ON CONFLICT (account_id) DO UPDATE
  SET 
    subscription_id = EXCLUDED.subscription_id,
    status = 'in_progress',
    triggered_at = NOW(),
    started_at = NOW(),
    errors = '[]'::jsonb,
    updated_at = NOW()
  RETURNING id INTO v_onboarding_id;
  
  RETURN v_onboarding_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update onboarding status
CREATE OR REPLACE FUNCTION public.update_onboarding_status(
  p_account_id UUID,
  p_status TEXT,
  p_steps_completed JSONB DEFAULT NULL,
  p_errors JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dashboard.onboarding_status
  SET 
    status = p_status,
    steps_completed = COALESCE(p_steps_completed, steps_completed),
    errors = COALESCE(p_errors, errors),
    completed_at = CASE 
      WHEN p_status IN ('completed', 'failed') THEN NOW()
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE account_id = p_account_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get onboarding status
CREATE OR REPLACE FUNCTION public.get_onboarding_status(
  p_account_id UUID
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  subscription_id UUID,
  status TEXT,
  steps_completed JSONB,
  errors JSONB,
  triggered_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.account_id,
    o.subscription_id,
    o.status,
    o.steps_completed,
    o.errors,
    o.triggered_at,
    o.started_at,
    o.completed_at,
    o.created_at,
    o.updated_at
  FROM dashboard.onboarding_status o
  WHERE o.account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_onboarding_status(UUID, UUID) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.update_onboarding_status(UUID, TEXT, JSONB, JSONB) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.get_onboarding_status(UUID) TO service_role, postgres, authenticated;

-- Add comments
COMMENT ON TABLE dashboard.onboarding_status IS 'Tracks onboarding progress for accounts. Onboarding is triggered when first subscription is activated.';
COMMENT ON COLUMN dashboard.onboarding_status.status IS 'Current status: not_started, pending, in_progress, completed, or failed';
COMMENT ON COLUMN dashboard.onboarding_status.steps_completed IS 'Array of completed step IDs (e.g., ["api_keys", "default_theme", "boltx_config"])';
COMMENT ON COLUMN dashboard.onboarding_status.errors IS 'Array of error messages if any step failed';

