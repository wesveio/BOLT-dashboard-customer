-- ============================================================================
-- ADDITIONAL INDEXES FOR AUTH PERFORMANCE
-- ============================================================================

-- Index for rate limiting checks on auth_codes
CREATE INDEX idx_auth_codes_rate_limit
ON dashboard.auth_codes (email, created_at DESC)
WHERE used = false AND expires_at > NOW();

-- Index for session cleanup
CREATE INDEX idx_sessions_cleanup
ON dashboard.sessions (expires_at)
WHERE expires_at < NOW();

-- ============================================================================
-- FUNCTIONS FOR AUTH
-- ============================================================================

-- Function to clean expired auth codes (runs automatically via trigger)
CREATE OR REPLACE FUNCTION dashboard.cleanup_expired_auth_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM dashboard.auth_codes
  WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION dashboard.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM dashboard.sessions
  WHERE expires_at < NOW() OR refresh_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit for auth codes
CREATE OR REPLACE FUNCTION dashboard.check_auth_code_rate_limit(
  p_email TEXT,
  p_limit_hours INTEGER DEFAULT 1,
  p_max_codes INTEGER DEFAULT 3
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM dashboard.auth_codes
  WHERE email = p_email
    AND created_at > NOW() - (p_limit_hours || ' hours')::INTERVAL
    AND used = false;

  RETURN v_count < p_max_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

