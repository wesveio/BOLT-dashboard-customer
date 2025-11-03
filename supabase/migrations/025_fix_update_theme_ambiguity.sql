-- ============================================================================
-- FIX UPDATE_THEME FUNCTION - Ambiguous column reference
-- ============================================================================
-- Fix the ambiguous column reference "id" and "account_id" errors in update_theme function
-- by explicitly qualifying column names in WHERE clauses

DROP FUNCTION IF EXISTS public.update_theme(UUID, UUID, TEXT, JSONB, TEXT, VARCHAR);

CREATE FUNCTION public.update_theme(
  p_theme_id UUID,
  p_account_id UUID,
  p_name TEXT DEFAULT NULL,
  p_config JSONB DEFAULT NULL,
  p_preview_image_url TEXT DEFAULT NULL,
  p_base_theme VARCHAR(50) DEFAULT NULL
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
  -- Prevent updating readonly themes
  -- Fixed: Explicitly qualify column names to avoid ambiguity
  IF EXISTS (
    SELECT 1 FROM dashboard.theme_configs
    WHERE dashboard.theme_configs.id = p_theme_id
      AND dashboard.theme_configs.account_id = p_account_id
      AND dashboard.theme_configs.is_readonly = true
  ) THEN
    RAISE EXCEPTION 'Cannot update readonly theme';
  END IF;

  -- Fixed: Explicitly qualify column names in UPDATE WHERE clause to avoid ambiguity
  UPDATE dashboard.theme_configs
  SET 
    name = COALESCE(p_name, dashboard.theme_configs.name),
    config = COALESCE(p_config, dashboard.theme_configs.config),
    preview_image_url = COALESCE(p_preview_image_url, dashboard.theme_configs.preview_image_url),
    base_theme = COALESCE(p_base_theme, dashboard.theme_configs.base_theme),
    updated_at = NOW()
  WHERE dashboard.theme_configs.id = p_theme_id
    AND dashboard.theme_configs.account_id = p_account_id
    AND dashboard.theme_configs.is_readonly = false;
  
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
    t.is_default,
    t.base_theme,
    t.is_readonly
  FROM dashboard.theme_configs t
  WHERE t.id = p_theme_id
    AND t.account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

