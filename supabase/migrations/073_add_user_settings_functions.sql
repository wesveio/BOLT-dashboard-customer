-- ============================================================================
-- Migration: Add user settings RPC functions
-- ============================================================================
-- Problem: PostgREST cannot access dashboard.users directly
-- Solution: Create RPC functions in public schema to access settings
-- ============================================================================

-- Function to get user settings
CREATE OR REPLACE FUNCTION public.get_user_settings(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_settings JSONB;
BEGIN
  SELECT settings INTO v_settings
  FROM dashboard.users
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_settings, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user settings
CREATE OR REPLACE FUNCTION public.update_user_settings(
  p_user_id UUID,
  p_settings JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_updated_settings JSONB;
BEGIN
  UPDATE dashboard.users
  SET 
    settings = p_settings,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING settings INTO v_updated_settings;
  
  RETURN COALESCE(v_updated_settings, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_settings(UUID) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_settings(UUID, JSONB) TO service_role, postgres, authenticated;

