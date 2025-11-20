-- ============================================================================
-- Migration: Update get_account_by_id to include all account fields
-- ============================================================================
-- Problem: get_account_by_id function doesn't return currency, billing_email,
--          current_subscription_id, demo_mode, and onboarding_required fields
-- Solution: Drop and recreate the function with all account fields
-- ============================================================================

-- Drop existing function first (required when changing return type)
DROP FUNCTION IF EXISTS public.get_account_by_id(UUID);

-- Recreate get_account_by_id function with all fields
CREATE FUNCTION public.get_account_by_id(p_account_id UUID)
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
  WHERE a.id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission (if not already granted)
GRANT EXECUTE ON FUNCTION public.get_account_by_id(UUID) TO service_role, postgres, authenticated;

