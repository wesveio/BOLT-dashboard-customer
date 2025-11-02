-- ============================================================================
-- THEME CONFIGS FUNCTIONS
-- ============================================================================
-- These functions expose dashboard.theme_configs table through public schema
-- since PostgREST only exposes public schema by default

-- Get themes by account_id
CREATE OR REPLACE FUNCTION public.get_themes_by_account(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  name TEXT,
  is_active BOOLEAN,
  config JSONB,
  preview_image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.account_id,
    t.name,
    t.is_active,
    t.config,
    t.preview_image_url,
    t.created_at,
    t.updated_at,
    t.created_by
  FROM dashboard.theme_configs t
  WHERE t.account_id = p_account_id
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get theme by id and account_id
CREATE OR REPLACE FUNCTION public.get_theme_by_id(
  p_theme_id UUID,
  p_account_id UUID
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  name TEXT,
  is_active BOOLEAN,
  config JSONB,
  preview_image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.account_id,
    t.name,
    t.is_active,
    t.config,
    t.preview_image_url,
    t.created_at,
    t.updated_at,
    t.created_by
  FROM dashboard.theme_configs t
  WHERE t.id = p_theme_id
    AND t.account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if theme exists and belongs to account
CREATE OR REPLACE FUNCTION public.check_theme_exists(
  p_theme_id UUID,
  p_account_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM dashboard.theme_configs
    WHERE id = p_theme_id
      AND account_id = p_account_id
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create theme
CREATE OR REPLACE FUNCTION public.create_theme(
  p_account_id UUID,
  p_name TEXT,
  p_config JSONB,
  p_created_by UUID,
  p_preview_image_url TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  name TEXT,
  is_active BOOLEAN,
  config JSONB,
  preview_image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
DECLARE
  v_theme_id UUID;
BEGIN
  INSERT INTO dashboard.theme_configs (
    account_id,
    name,
    config,
    is_active,
    created_by,
    preview_image_url
  )
  VALUES (
    p_account_id,
    p_name,
    p_config,
    p_is_active,
    p_created_by,
    p_preview_image_url
  )
  RETURNING dashboard.theme_configs.id INTO v_theme_id;
  
  RETURN QUERY
  SELECT 
    t.id,
    t.account_id,
    t.name,
    t.is_active,
    t.config,
    t.preview_image_url,
    t.created_at,
    t.updated_at,
    t.created_by
  FROM dashboard.theme_configs t
  WHERE t.id = v_theme_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update theme
CREATE OR REPLACE FUNCTION public.update_theme(
  p_theme_id UUID,
  p_account_id UUID,
  p_name TEXT DEFAULT NULL,
  p_config JSONB DEFAULT NULL,
  p_preview_image_url TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  name TEXT,
  is_active BOOLEAN,
  config JSONB,
  preview_image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
BEGIN
  UPDATE dashboard.theme_configs
  SET 
    name = COALESCE(p_name, name),
    config = COALESCE(p_config, config),
    preview_image_url = COALESCE(p_preview_image_url, preview_image_url),
    updated_at = NOW()
  WHERE id = p_theme_id
    AND account_id = p_account_id;
  
  RETURN QUERY
  SELECT 
    t.id,
    t.account_id,
    t.name,
    t.is_active,
    t.config,
    t.preview_image_url,
    t.created_at,
    t.updated_at,
    t.created_by
  FROM dashboard.theme_configs t
  WHERE t.id = p_theme_id
    AND t.account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deactivate all themes for account
CREATE OR REPLACE FUNCTION public.deactivate_all_themes(p_account_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE dashboard.theme_configs
  SET is_active = false,
      updated_at = NOW()
  WHERE account_id = p_account_id;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activate theme
CREATE OR REPLACE FUNCTION public.activate_theme(
  p_theme_id UUID,
  p_account_id UUID
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  name TEXT,
  is_active BOOLEAN,
  config JSONB,
  preview_image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
BEGIN
  -- First deactivate all themes for this account
  PERFORM public.deactivate_all_themes(p_account_id);
  
  -- Then activate the specified theme
  UPDATE dashboard.theme_configs
  SET is_active = true,
      updated_at = NOW()
  WHERE id = p_theme_id
    AND account_id = p_account_id;
  
  RETURN QUERY
  SELECT 
    t.id,
    t.account_id,
    t.name,
    t.is_active,
    t.config,
    t.preview_image_url,
    t.created_at,
    t.updated_at,
    t.created_by
  FROM dashboard.theme_configs t
  WHERE t.id = p_theme_id
    AND t.account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

