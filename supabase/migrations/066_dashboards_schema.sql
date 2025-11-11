-- ============================================================================
-- DASHBOARDS SCHEMA
-- ============================================================================
-- Create tables and functions for custom dashboards system

-- Dashboards table
CREATE TABLE IF NOT EXISTS dashboard.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES dashboard.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  layout JSONB NOT NULL DEFAULT '{"widgets": [], "columns": 12}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES dashboard.users(id) ON DELETE SET NULL,
  CONSTRAINT check_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboards_account ON dashboard.dashboards (account_id, is_public);
CREATE INDEX IF NOT EXISTS idx_dashboards_user ON dashboard.dashboards (user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_public ON dashboard.dashboards (account_id) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_dashboards_updated ON dashboard.dashboards (updated_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION dashboard.update_dashboards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dashboards_updated_at
  BEFORE UPDATE ON dashboard.dashboards
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_dashboards_updated_at();

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Get dashboards by account (public + user's private)
CREATE OR REPLACE FUNCTION public.get_dashboards_by_account(
  p_account_id UUID,
  p_user_id UUID
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
BEGIN
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
  WHERE d.account_id = p_account_id
    AND (
      d.is_public = true 
      OR d.user_id = p_user_id
      OR d.created_by = p_user_id
    )
  ORDER BY d.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create dashboard
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
  -- Validate user belongs to account
  IF NOT EXISTS (
    SELECT 1 FROM dashboard.users 
    WHERE id = p_user_id AND account_id = p_account_id
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

-- Update dashboard
CREATE OR REPLACE FUNCTION public.update_dashboard(
  p_dashboard_id UUID,
  p_account_id UUID,
  p_user_id UUID,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT NULL,
  p_layout JSONB DEFAULT NULL
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
BEGIN
  -- Validate user can edit this dashboard
  IF NOT EXISTS (
    SELECT 1 FROM dashboard.dashboards d
    WHERE d.id = p_dashboard_id
      AND d.account_id = p_account_id
      AND (
        d.user_id = p_user_id
        OR d.created_by = p_user_id
        OR d.is_public = true
      )
  ) THEN
    RAISE EXCEPTION 'User does not have permission to edit this dashboard';
  END IF;

  -- Update dashboard
  UPDATE dashboard.dashboards
  SET 
    name = COALESCE(p_name, dashboard.dashboards.name),
    description = COALESCE(p_description, dashboard.dashboards.description),
    is_public = COALESCE(p_is_public, dashboard.dashboards.is_public),
    layout = COALESCE(p_layout, dashboard.dashboards.layout),
    updated_at = NOW()
  WHERE dashboard.dashboards.id = p_dashboard_id
    AND dashboard.dashboards.account_id = p_account_id;

  -- Return updated dashboard
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
  WHERE d.id = p_dashboard_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete dashboard
CREATE OR REPLACE FUNCTION public.delete_dashboard(
  p_dashboard_id UUID,
  p_account_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate user can delete this dashboard
  IF NOT EXISTS (
    SELECT 1 FROM dashboard.dashboards d
    WHERE d.id = p_dashboard_id
      AND d.account_id = p_account_id
      AND (
        d.user_id = p_user_id
        OR d.created_by = p_user_id
      )
  ) THEN
    RAISE EXCEPTION 'User does not have permission to delete this dashboard';
  END IF;

  -- Delete dashboard
  DELETE FROM dashboard.dashboards
  WHERE dashboard.dashboards.id = p_dashboard_id
    AND dashboard.dashboards.account_id = p_account_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Duplicate dashboard
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
  -- Get original dashboard
  SELECT * INTO v_dashboard
  FROM dashboard.dashboards
  WHERE id = p_dashboard_id
    AND account_id = p_account_id
    AND (
      is_public = true
      OR user_id = p_user_id
      OR created_by = p_user_id
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

-- Get dashboard by ID
CREATE OR REPLACE FUNCTION public.get_dashboard_by_id(
  p_dashboard_id UUID,
  p_account_id UUID,
  p_user_id UUID
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
BEGIN
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
  WHERE d.id = p_dashboard_id
    AND d.account_id = p_account_id
    AND (
      d.is_public = true
      OR d.user_id = p_user_id
      OR d.created_by = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA dashboard TO postgres, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard.dashboards TO service_role;

