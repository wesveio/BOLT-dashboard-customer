-- ============================================================================
-- Migration: Add public function for create_subscription
-- ============================================================================
-- Problem: PostgREST only exposes 'public' schema
-- Solution: Create SQL function wrapper in 'public' schema that calls 
--           dashboard.create_subscription
-- ============================================================================

-- Create subscription (wrapper for dashboard.create_subscription)
CREATE OR REPLACE FUNCTION public.create_subscription(
  p_account_id UUID,
  p_plan_id UUID,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS UUID AS $$
BEGIN
  RETURN dashboard.create_subscription(
    p_account_id,
    p_plan_id,
    p_billing_cycle
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_subscription(UUID, UUID, TEXT) TO service_role, postgres, authenticated;

