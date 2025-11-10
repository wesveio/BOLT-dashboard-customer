-- ============================================================================
-- Migration: Update create_account to set demo_mode and onboarding_required
-- ============================================================================
-- Updates the create_account function to explicitly set demo_mode = true
-- and onboarding_required = true for new accounts
-- ============================================================================

-- Update create_account function to set demo_mode and onboarding_required
CREATE OR REPLACE FUNCTION public.create_account(
  p_vtex_account_name TEXT,
  p_company_name TEXT,
  p_plan_type TEXT DEFAULT 'basic',
  p_status TEXT DEFAULT 'trial' -- Default to 'trial' for new accounts
)
RETURNS UUID AS $$
DECLARE
  v_account_id UUID;
BEGIN
  INSERT INTO customer.accounts (
    vtex_account_name, 
    company_name, 
    plan_type, 
    status,
    demo_mode,
    onboarding_required
  )
  VALUES (
    p_vtex_account_name, 
    p_company_name, 
    p_plan_type, 
    p_status,
    true, -- New accounts start in demo mode
    true  -- Onboarding required until subscription activated
  )
  RETURNING id INTO v_account_id;
  
  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_account(TEXT, TEXT, TEXT, TEXT) TO service_role, postgres;

