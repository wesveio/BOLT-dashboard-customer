-- ============================================================================
-- Migration: Fix ambiguous column reference in create_user function
-- ============================================================================
-- Problem: Column reference "id" is ambiguous in create_user function
-- Solution: Use explicit aliases to avoid conflict with RETURNS TABLE columns
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_user(UUID, TEXT, TEXT, TEXT, TEXT) CASCADE;

CREATE FUNCTION public.create_user(
  p_account_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT DEFAULT 'viewer'
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT
) AS $$
DECLARE
  v_new_user_id UUID;
  v_inserted_record dashboard.users%ROWTYPE;
BEGIN
  -- Insert user and get the ID directly
  INSERT INTO dashboard.users (account_id, email, first_name, last_name, name, role)
  VALUES (
    p_account_id,
    LOWER(p_email),
    p_first_name,
    p_last_name,
    p_first_name || ' ' || p_last_name,
    p_role
  )
  RETURNING * INTO v_inserted_record;
  
  v_new_user_id := v_inserted_record.id;
  
  -- Return the created user
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role
  FROM dashboard.users u
  WHERE u.id = v_new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_user TO service_role, postgres, anon, authenticated;

