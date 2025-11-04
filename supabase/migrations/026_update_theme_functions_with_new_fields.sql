-- ============================================================================
-- UPDATE THEME FUNCTIONS TO INCLUDE NEW FIELDS
-- ============================================================================
-- Updates existing theme functions to return base_theme, is_default, is_readonly

-- Update get_themes_by_account to include new fields
DROP FUNCTION IF EXISTS public.get_themes_by_account(UUID);
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
  created_by UUID,
  is_default BOOLEAN,
  base_theme VARCHAR(50),
  is_readonly BOOLEAN
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
    t.created_by,
    COALESCE(t.is_default, false),
    t.base_theme,
    COALESCE(t.is_readonly, false)
  FROM dashboard.theme_configs t
  WHERE t.account_id = p_account_id
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_theme_by_id to include new fields
DROP FUNCTION IF EXISTS public.get_theme_by_id(UUID, UUID);
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
  created_by UUID,
  is_default BOOLEAN,
  base_theme VARCHAR(50),
  is_readonly BOOLEAN
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
    t.created_by,
    COALESCE(t.is_default, false),
    t.base_theme,
    COALESCE(t.is_readonly, false)
  FROM dashboard.theme_configs t
  WHERE t.id = p_theme_id
    AND t.account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update activate_theme to return new fields
DROP FUNCTION IF EXISTS public.activate_theme(UUID, UUID);
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
  created_by UUID,
  is_default BOOLEAN,
  base_theme VARCHAR(50),
  is_readonly BOOLEAN
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
    t.created_by,
    COALESCE(t.is_default, false),
    t.base_theme,
    COALESCE(t.is_readonly, false)
  FROM dashboard.theme_configs t
  WHERE t.id = p_theme_id
    AND t.account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

