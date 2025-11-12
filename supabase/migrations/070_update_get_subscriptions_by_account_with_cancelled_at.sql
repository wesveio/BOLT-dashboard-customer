-- ============================================================================
-- UPDATE GET_SUBSCRIPTIONS_BY_ACCOUNT FUNCTION
-- ============================================================================
-- This migration updates the get_subscriptions_by_account function to include
-- the cancelled_at field that was added in migration 069
-- ============================================================================
-- Note: We need to DROP and recreate the function because PostgreSQL doesn't
-- allow changing the return type of an existing function with CREATE OR REPLACE
-- ============================================================================

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_subscriptions_by_account(UUID);

-- Recreate function with cancelled_at field included
CREATE FUNCTION public.get_subscriptions_by_account(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  plan_id UUID,
  status TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  billing_cycle TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  plan JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.account_id,
    s.plan_id,
    s.status,
    s.started_at,
    s.ended_at,
    s.cancelled_at,
    s.billing_cycle,
    s.created_at,
    s.updated_at,
    to_jsonb(p.*) as plan
  FROM dashboard.subscriptions s
  JOIN dashboard.plans p ON s.plan_id = p.id
  WHERE s.account_id = p_account_id
  ORDER BY s.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_subscriptions_by_account(UUID) 
  TO service_role, postgres, authenticated;

