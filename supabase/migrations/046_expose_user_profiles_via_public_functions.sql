-- ============================================================================
-- USER PROFILES FUNCTIONS
-- ============================================================================
-- These functions expose analytics.user_profiles table through public schema
-- since PostgREST only exposes public schema by default

-- Get user profiles by customer_id and date range
CREATE OR REPLACE FUNCTION public.get_user_profiles(
  p_customer_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL, -- 'active' (updated in last 24h), 'inactive', 'all'
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  device_type TEXT,
  browser TEXT,
  location JSONB,
  behavior JSONB,
  preferences JSONB,
  inferred_intent JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.session_id,
    p.device_type,
    p.browser,
    p.location,
    p.behavior,
    p.preferences,
    p.inferred_intent,
    p.metadata,
    p.created_at,
    p.updated_at
  FROM analytics.user_profiles p
  WHERE p.customer_id = p_customer_id
    AND (p_start_date IS NULL OR p.updated_at >= p_start_date)
    AND (p_end_date IS NULL OR p.updated_at <= p_end_date)
    AND (p_device_type IS NULL OR p.device_type = p_device_type)
    AND (
      p_status IS NULL 
      OR p_status = 'all'
      OR (p_status = 'active' AND p.updated_at >= NOW() - INTERVAL '24 hours')
      OR (p_status = 'inactive' AND p.updated_at < NOW() - INTERVAL '24 hours')
    )
  ORDER BY p.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_profiles TO service_role, postgres, authenticated;

