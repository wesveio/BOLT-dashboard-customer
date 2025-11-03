-- ============================================================================
-- EXPAND THEME_CONFIGS SCHEMA
-- ============================================================================
-- Add new columns to support default themes, base themes, and readonly status
-- This allows users to use predefined themes (default, single-page, liquid-glass)
-- or create custom themes based on them

-- Add new columns to theme_configs
ALTER TABLE dashboard.theme_configs
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS base_theme VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_readonly BOOLEAN DEFAULT false;

-- Add constraint for base_theme values
ALTER TABLE dashboard.theme_configs
ADD CONSTRAINT check_base_theme 
CHECK (base_theme IS NULL OR base_theme IN ('default', 'single-page', 'liquid-glass'));

-- Add comment explaining the columns
COMMENT ON COLUMN dashboard.theme_configs.is_default IS 'Indicates if this is one of the 3 predefined themes (default, single-page, liquid-glass)';
COMMENT ON COLUMN dashboard.theme_configs.base_theme IS 'Base theme used when duplicating: default, single-page, liquid-glass, or NULL for custom';
COMMENT ON COLUMN dashboard.theme_configs.is_readonly IS 'Default themes are read-only and cannot be edited directly';

-- Update functions to include new columns
-- ============================================================================
-- UPDATE GET_THEMES_BY_ACCOUNT FUNCTION
-- ============================================================================
-- Drop and recreate to change return type (PostgreSQL doesn't allow changing return type with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS public.get_themes_by_account(UUID);
CREATE FUNCTION public.get_themes_by_account(p_account_id UUID)
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
    t.is_default,
    t.base_theme,
    t.is_readonly
  FROM dashboard.theme_configs t
  WHERE t.account_id = p_account_id
  ORDER BY t.is_default DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE GET_THEME_BY_ID FUNCTION
-- ============================================================================
-- Drop and recreate to change return type
DROP FUNCTION IF EXISTS public.get_theme_by_id(UUID, UUID);
CREATE FUNCTION public.get_theme_by_id(
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
    t.is_default,
    t.base_theme,
    t.is_readonly
  FROM dashboard.theme_configs t
  WHERE t.id = p_theme_id
    AND t.account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE CREATE_THEME FUNCTION
-- ============================================================================
-- Drop and recreate to change return type and parameters
DROP FUNCTION IF EXISTS public.create_theme(UUID, TEXT, JSONB, UUID, TEXT, BOOLEAN);
CREATE FUNCTION public.create_theme(
  p_account_id UUID,
  p_name TEXT,
  p_config JSONB,
  p_created_by UUID,
  p_preview_image_url TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT false,
  p_is_default BOOLEAN DEFAULT false,
  p_base_theme VARCHAR(50) DEFAULT NULL,
  p_is_readonly BOOLEAN DEFAULT false
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
DECLARE
  v_theme_id UUID;
BEGIN
  INSERT INTO dashboard.theme_configs (
    account_id,
    name,
    config,
    is_active,
    created_by,
    preview_image_url,
    is_default,
    base_theme,
    is_readonly
  )
  VALUES (
    p_account_id,
    p_name,
    p_config,
    p_is_active,
    p_created_by,
    p_preview_image_url,
    p_is_default,
    p_base_theme,
    p_is_readonly
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
    t.created_by,
    t.is_default,
    t.base_theme,
    t.is_readonly
  FROM dashboard.theme_configs t
  WHERE t.id = v_theme_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE UPDATE_THEME FUNCTION
-- ============================================================================
-- Drop and recreate to change return type
DROP FUNCTION IF EXISTS public.update_theme(UUID, UUID, TEXT, JSONB, TEXT);
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
  IF EXISTS (
    SELECT 1 FROM dashboard.theme_configs
    WHERE id = p_theme_id
      AND account_id = p_account_id
      AND is_readonly = true
  ) THEN
    RAISE EXCEPTION 'Cannot update readonly theme';
  END IF;

  UPDATE dashboard.theme_configs
  SET 
    name = COALESCE(p_name, name),
    config = COALESCE(p_config, config),
    preview_image_url = COALESCE(p_preview_image_url, preview_image_url),
    base_theme = COALESCE(p_base_theme, base_theme),
    updated_at = NOW()
  WHERE id = p_theme_id
    AND account_id = p_account_id
    AND is_readonly = false;
  
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

-- ============================================================================
-- UPDATE ACTIVATE_THEME FUNCTION
-- ============================================================================
-- Drop and recreate to change return type
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
    t.is_default,
    t.base_theme,
    t.is_readonly
  FROM dashboard.theme_configs t
  WHERE t.id = p_theme_id
    AND t.account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NEW FUNCTION: DUPLICATE_THEME
-- ============================================================================
-- Allows duplicating a theme (default or custom) to create an editable copy
CREATE OR REPLACE FUNCTION public.duplicate_theme(
  p_theme_id UUID,
  p_account_id UUID,
  p_new_name TEXT,
  p_created_by UUID
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
DECLARE
  v_source_theme RECORD;
  v_new_theme_id UUID;
  v_base_theme VARCHAR(50);
BEGIN
  -- Get source theme
  SELECT * INTO v_source_theme
  FROM dashboard.theme_configs
  WHERE id = p_theme_id
    AND account_id = p_account_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Theme not found';
  END IF;
  
  -- Determine base_theme: if source is default, use its base_theme or theme name
  -- If source is custom, use its base_theme or NULL
  IF v_source_theme.is_default THEN
    -- If it's a default theme, the base_theme should be the theme identifier
    -- We'll use the config.layout.type or infer from name/config
    v_base_theme := v_source_theme.base_theme;
    -- If base_theme is not set, try to infer from config
    IF v_base_theme IS NULL THEN
      -- Try to get from config layout or name
      IF v_source_theme.config->'layout'->>'type' = 'single-page' THEN
        v_base_theme := 'single-page';
      ELSIF v_source_theme.config->'features'->>'glassmorphism' = 'true' THEN
        v_base_theme := 'liquid-glass';
      ELSE
        v_base_theme := 'default';
      END IF;
    END IF;
  ELSE
    -- Custom theme: preserve its base_theme
    v_base_theme := v_source_theme.base_theme;
  END IF;
  
  -- Create duplicate
  INSERT INTO dashboard.theme_configs (
    account_id,
    name,
    config,
    is_active,
    created_by,
    preview_image_url,
    is_default,
    base_theme,
    is_readonly
  )
  VALUES (
    p_account_id,
    p_new_name,
    v_source_theme.config,
    false, -- New theme is not active by default
    p_created_by,
    v_source_theme.preview_image_url,
    false, -- Duplicated themes are never default
    v_base_theme,
    false  -- Duplicated themes are always editable
  )
  RETURNING dashboard.theme_configs.id INTO v_new_theme_id;
  
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
  WHERE t.id = v_new_theme_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NEW FUNCTION: GET_ACTIVE_THEME
-- ============================================================================
-- Get the active theme for an account (for checkout integration)
CREATE OR REPLACE FUNCTION public.get_active_theme(p_account_id UUID)
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
    t.is_default,
    t.base_theme,
    t.is_readonly
  FROM dashboard.theme_configs t
  WHERE t.account_id = p_account_id
    AND t.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

