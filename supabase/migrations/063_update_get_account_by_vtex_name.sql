-- ============================================================================
-- Migration: Update get_account_by_vtex_name to include demo_mode fields
-- ============================================================================
-- Updates the function to return demo_mode and onboarding_required fields
-- ============================================================================

-- Drop existing function first (required when changing return type)
DROP FUNCTION IF EXISTS public.get_account_by_vtex_name(TEXT);

-- Create updated get_account_by_vtex_name function with new fields
CREATE FUNCTION public.get_account_by_vtex_name(p_vtex_account_name TEXT)
RETURNS TABLE (
  id UUID,
  vtex_account_name TEXT,
  company_name TEXT,
  plan_type TEXT,
  status TEXT,
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
    COALESCE(a.demo_mode, true) AS demo_mode, -- Default to true if null
    COALESCE(a.onboarding_required, true) AS onboarding_required, -- Default to true if null
    a.created_at,
    a.updated_at
  FROM customer.accounts a
  WHERE a.vtex_account_name = p_vtex_account_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_account_by_vtex_name(TEXT) TO service_role, postgres, authenticated;

