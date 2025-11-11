-- ============================================================================
-- Fix create_dashboard and duplicate_dashboard functions - resolve column ambiguity
-- ============================================================================
-- Problem: Column reference "id" is ambiguous in functions with RETURNS TABLE
-- Solution: Qualify all column references with table aliases
-- ============================================================================

-- Fix create_dashboard function to resolve ambiguity
CREATE OR REPLACE FUNCTION public.create_dashboard(
  p_account_id UUID,
  p_user_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT false,
  p_layout JSONB DEFAULT '{"widgets": [], "columns": 12}'::jsonb
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  is_public BOOLEAN,
  layout JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
DECLARE
  v_dashboard_id UUID;
BEGIN
  -- Validate user belongs to account - qualify column references
  IF NOT EXISTS (
    SELECT 1 FROM dashboard.users u
    WHERE u.id = p_user_id AND u.account_id = p_account_id
  ) THEN
    RAISE EXCEPTION 'User does not belong to account';
  END IF;

  -- Insert dashboard
  INSERT INTO dashboard.dashboards (
    account_id,
    user_id,
    name,
    description,
    is_public,
    layout,
    created_by
  )
  VALUES (
    p_account_id,
    p_user_id,
    p_name,
    p_description,
    p_is_public,
    p_layout,
    p_user_id
  )
  RETURNING dashboard.dashboards.id INTO v_dashboard_id;

  -- Return created dashboard
  RETURN QUERY
  SELECT 
    d.id,
    d.account_id,
    d.user_id,
    d.name,
    d.description,
    d.is_public,
    d.layout,
    d.created_at,
    d.updated_at,
    d.created_by
  FROM dashboard.dashboards d
  WHERE d.id = v_dashboard_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix duplicate_dashboard function to resolve ambiguity
CREATE OR REPLACE FUNCTION public.duplicate_dashboard(
  p_dashboard_id UUID,
  p_account_id UUID,
  p_user_id UUID,
  p_new_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  is_public BOOLEAN,
  layout JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
DECLARE
  v_dashboard dashboard.dashboards%ROWTYPE;
  v_new_dashboard_id UUID;
  v_new_name TEXT;
BEGIN
  -- Get original dashboard - qualify column references
  SELECT * INTO v_dashboard
  FROM dashboard.dashboards d
  WHERE d.id = p_dashboard_id
    AND d.account_id = p_account_id
    AND (
      d.is_public = true
      OR d.user_id = p_user_id
      OR d.created_by = p_user_id
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dashboard not found or user does not have access';
  END IF;

  -- Generate new name
  v_new_name := COALESCE(
    p_new_name,
    v_dashboard.name || ' (Copy)'
  );

  -- Create duplicate (always private)
  INSERT INTO dashboard.dashboards (
    account_id,
    user_id,
    name,
    description,
    is_public,
    layout,
    created_by
  )
  VALUES (
    v_dashboard.account_id,
    p_user_id,
    v_new_name,
    v_dashboard.description,
    false, -- Duplicates are always private
    v_dashboard.layout,
    p_user_id
  )
  RETURNING dashboard.dashboards.id INTO v_new_dashboard_id;

  -- Return duplicated dashboard
  RETURN QUERY
  SELECT 
    d.id,
    d.account_id,
    d.user_id,
    d.name,
    d.description,
    d.is_public,
    d.layout,
    d.created_at,
    d.updated_at,
    d.created_by
  FROM dashboard.dashboards d
  WHERE d.id = v_new_dashboard_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_dashboard(UUID, UUID, TEXT, TEXT, BOOLEAN, JSONB) TO service_role, postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.duplicate_dashboard(UUID, UUID, UUID, TEXT) TO service_role, postgres, authenticated, anon;

