-- ============================================================================
-- SUBSCRIPTION CANCELLATION MIGRATION
-- ============================================================================
-- This migration adds support for subscription cancellation with period-end logic
-- ============================================================================

-- ============================================================================
-- ADD CANCELLED_AT FIELD TO SUBSCRIPTIONS TABLE
-- ============================================================================
-- Track when a subscription was cancelled (for audit purposes)
ALTER TABLE dashboard.subscriptions
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add index for cancelled subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancelled_at 
  ON dashboard.subscriptions (cancelled_at) 
  WHERE cancelled_at IS NOT NULL;

-- ============================================================================
-- FUNCTION: Calculate period end based on last transaction
-- ============================================================================
-- This function calculates the end date of the billing period based on the
-- last successful transaction date and the billing cycle
CREATE OR REPLACE FUNCTION dashboard.calculate_subscription_period_end(
  p_subscription_id UUID
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_last_transaction_date TIMESTAMPTZ;
  v_billing_cycle TEXT;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Get the last successful transaction date
  SELECT transaction_date INTO v_last_transaction_date
  FROM dashboard.subscription_transactions
  WHERE subscription_id = p_subscription_id
    AND status = 'completed'
  ORDER BY transaction_date DESC
  LIMIT 1;

  -- If no transaction found, return NULL
  IF v_last_transaction_date IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get billing cycle from subscription
  SELECT billing_cycle INTO v_billing_cycle
  FROM dashboard.subscriptions
  WHERE id = p_subscription_id;

  -- Calculate period end based on billing cycle
  IF v_billing_cycle = 'monthly' THEN
    v_period_end := v_last_transaction_date + INTERVAL '1 month';
  ELSIF v_billing_cycle = 'yearly' THEN
    v_period_end := v_last_transaction_date + INTERVAL '1 year';
  ELSE
    -- Default to monthly if unknown
    v_period_end := v_last_transaction_date + INTERVAL '1 month';
  END IF;

  RETURN v_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION dashboard.calculate_subscription_period_end(UUID) 
  TO service_role, postgres, authenticated;

-- ============================================================================
-- FUNCTION: Update subscription status when period ends
-- ============================================================================
-- This function updates subscriptions that have passed their ended_at date
-- from 'active' to 'cancelled'
CREATE OR REPLACE FUNCTION dashboard.update_expired_cancelled_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE dashboard.subscriptions
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE status = 'active'
    AND ended_at IS NOT NULL
    AND cancelled_at IS NOT NULL
    AND ended_at <= NOW();

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION dashboard.update_expired_cancelled_subscriptions() 
  TO service_role, postgres, authenticated;

-- Create public wrapper function for PostgREST access
CREATE OR REPLACE FUNCTION public.update_expired_cancelled_subscriptions()
RETURNS INTEGER AS $$
BEGIN
  RETURN dashboard.update_expired_cancelled_subscriptions();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on public function
GRANT EXECUTE ON FUNCTION public.update_expired_cancelled_subscriptions() 
  TO service_role, postgres, authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN dashboard.subscriptions.cancelled_at IS 
  'Timestamp when the subscription was cancelled. Used to track cancellation date separately from ended_at.';

COMMENT ON FUNCTION dashboard.calculate_subscription_period_end(UUID) IS 
  'Calculates the end date of the billing period based on the last successful transaction and billing cycle.';

COMMENT ON FUNCTION dashboard.update_expired_cancelled_subscriptions() IS 
  'Updates subscriptions that have passed their ended_at date from active to cancelled status.';

