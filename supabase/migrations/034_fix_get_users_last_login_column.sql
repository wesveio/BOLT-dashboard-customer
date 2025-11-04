-- ============================================================================
-- Fix get_users_by_account function - use correct column name
-- ============================================================================
-- Problem: Function was using last_login_at but column is actually last_login
-- Solution: Update function to use correct column name last_login

-- Fix get_users_by_account function to use correct column name
CREATE OR REPLACE FUNCTION public.get_users_by_account(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.role,
    u.name,
    u.first_name,
    u.last_name,
    u.created_at,
    u.last_login  -- Fixed: Use last_login column (not last_login_at)
  FROM dashboard.users u
  WHERE u.account_id = p_account_id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_users_by_account(UUID) TO service_role, postgres, authenticated;

