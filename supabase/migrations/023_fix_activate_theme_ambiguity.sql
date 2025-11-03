-- ============================================================================
-- FIX ACTIVATE_THEME FUNCTION - Ambiguous column reference
-- ============================================================================
-- Fix the ambiguous column reference "id" error in activate_theme function
-- by explicitly qualifying column names in WHERE clauses

DROP FUNCTION IF EXISTS public.activate_theme(UUID, UUID);

CREATE FUNCTION public.activate_theme(
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
  -- Fixed: Explicitly qualify column names to avoid ambiguity
  UPDATE dashboard.theme_configs
  SET is_active = true,
      updated_at = NOW()
  WHERE dashboard.theme_configs.id = p_theme_id
    AND dashboard.theme_configs.account_id = p_account_id;
  
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

