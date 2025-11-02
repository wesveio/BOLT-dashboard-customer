-- ============================================================================
-- Migration: Fix last_login column name in functions
-- ============================================================================
-- Problem: Functions use last_login_at but column was renamed to last_login
-- Solution: Drop and recreate functions with correct column name
-- Note: Cannot use CREATE OR REPLACE when changing return type
-- ============================================================================

-- Drop existing functions (if they exist)
-- Use CASCADE to handle dependencies automatically
DROP FUNCTION IF EXISTS public.get_user_by_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_by_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_last_login(UUID) CASCADE;

-- Recreate get_user_by_email function with correct column name
CREATE FUNCTION public.get_user_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  account_id UUID,
  role TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.account_id,
    u.role,
    u.name,
    u.first_name,
    u.last_name,
    u.created_at,
    u.updated_at,
    u.last_login
  FROM dashboard.users u
  WHERE LOWER(u.email) = LOWER(p_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate get_user_by_id function with correct column name
CREATE FUNCTION public.get_user_by_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  account_id UUID,
  role TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.account_id,
    u.role,
    u.name,
    u.first_name,
    u.last_name,
    u.created_at,
    u.updated_at,
    u.last_login
  FROM dashboard.users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate update_user_last_login function with correct column name
CREATE FUNCTION public.update_user_last_login(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dashboard.users
  SET last_login = NOW()
  WHERE id = p_user_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_by_email TO service_role, postgres, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_id TO service_role, postgres, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_last_login TO service_role, postgres, anon, authenticated;

