-- ============================================================================
-- Add get_account_by_id function
-- ============================================================================
-- This function retrieves account information by account ID from customer schema

-- Get account by ID
CREATE OR REPLACE FUNCTION public.get_account_by_id(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  vtex_account_name TEXT,
  company_name TEXT,
  plan_type TEXT,
  status TEXT,
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
    a.created_at,
    a.updated_at
  FROM customer.accounts a
  WHERE a.id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_account_by_id(UUID) TO service_role, postgres, authenticated;

