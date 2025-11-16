-- ============================================================================
-- Migration: Add settings field to get_user_by_id function
-- ============================================================================
-- Problem: Function get_user_by_id doesn't return settings field
-- Solution: Drop and recreate function with settings included
-- ============================================================================
-- This migration fixes the get_user_by_id RPC function to include the settings
-- JSONB field that was added in migration 005 but not included in the function
-- return type (migration 008).
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_user_by_id(UUID) CASCADE;

-- Recreate get_user_by_id function with settings field
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
  last_login TIMESTAMPTZ,
  settings JSONB
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
    u.last_login,
    u.settings
  FROM dashboard.users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_by_id(UUID) TO service_role, postgres, anon, authenticated;

