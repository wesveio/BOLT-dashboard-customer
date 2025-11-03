-- ============================================================================
-- DELETE THEME FUNCTION
-- ============================================================================
-- Allows deleting custom themes with proper validation
-- - Cannot delete active themes
-- - Cannot delete default themes (is_default = true)
-- - Must belong to the account

CREATE OR REPLACE FUNCTION public.delete_theme(
  p_theme_id UUID,
  p_account_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_theme RECORD;
  v_deleted_count INTEGER;
BEGIN
  -- Get theme to validate ownership and check if it's active or default
  SELECT 
    id,
    account_id,
    is_active,
    is_default
  INTO v_theme
  FROM dashboard.theme_configs
  WHERE id = p_theme_id
    AND account_id = p_account_id;

  -- Check if theme exists and belongs to account
  IF v_theme.id IS NULL THEN
    RAISE EXCEPTION 'Theme not found or does not belong to this account';
  END IF;

  -- Check if theme is active
  IF v_theme.is_active = true THEN
    RAISE EXCEPTION 'Cannot delete active theme. Please activate another theme first.';
  END IF;

  -- Check if theme is a default theme
  IF v_theme.is_default = true THEN
    RAISE EXCEPTION 'Cannot delete default themes';
  END IF;

  -- Delete the theme
  DELETE FROM dashboard.theme_configs
  WHERE id = p_theme_id
    AND account_id = p_account_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Return true if deleted successfully
  RETURN v_deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

