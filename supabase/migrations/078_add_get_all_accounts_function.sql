-- ============================================================================
-- Migration: Add get_all_accounts function for internal dashboard sync
-- ============================================================================
-- Problem: PostgREST doesn't expose customer schema, so we can't query 
--          customer.accounts directly. Need an RPC function to list all accounts.
-- Solution: Create get_all_accounts function in public schema with SECURITY DEFINER
--           to bypass RLS when using service_role
-- ============================================================================

-- Get all accounts (for internal dashboard sync)
-- This function bypasses RLS using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_all_accounts(
  p_limit INTEGER DEFAULT NULL,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  vtex_account_name TEXT,
  company_name TEXT,
  plan_type TEXT,
  status TEXT,
  currency TEXT,
  billing_email TEXT,
  current_subscription_id UUID,
  demo_mode BOOLEAN,
  onboarding_required BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.vtex_account_name,
    a.company_name,
    a.plan_type,
    a.status,
    COALESCE(a.currency, 'USD') AS currency,
    a.billing_email,
    a.current_subscription_id,
    COALESCE(a.demo_mode, true) AS demo_mode,
    COALESCE(a.onboarding_required, true) AS onboarding_required,
    a.created_at,
    a.updated_at
  FROM customer.accounts a
  ORDER BY a.created_at DESC
  LIMIT COALESCE(p_limit, NULL)
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get total count of accounts
CREATE OR REPLACE FUNCTION public.get_accounts_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM customer.accounts;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_all_accounts(INTEGER, INTEGER) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.get_accounts_count() TO service_role, postgres, authenticated;

