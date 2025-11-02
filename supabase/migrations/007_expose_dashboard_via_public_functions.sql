-- ============================================================================
-- Migration: Expose dashboard schema via public functions
-- ============================================================================
-- Problem: PostgREST only exposes 'public' and 'graphql_public' schemas
-- Solution: Create SQL functions in 'public' schema that access 'dashboard' tables
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA dashboard TO service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA dashboard TO service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA dashboard TO service_role, postgres;

-- ============================================================================
-- USER FUNCTIONS
-- ============================================================================

-- Check if user exists by email
CREATE OR REPLACE FUNCTION public.get_user_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  account_id UUID,
  role TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.account_id,
    u.role,
    u.name,
    u.first_name,
    u.last_name,
    u.created_at,
    u.updated_at,
    u.last_login
  FROM dashboard.users u
  WHERE LOWER(u.email) = LOWER(p_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user
CREATE OR REPLACE FUNCTION public.create_user(
  p_account_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_role TEXT DEFAULT 'viewer'
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT
) AS $$
DECLARE
  v_new_user_id UUID;
  v_inserted_record dashboard.users%ROWTYPE;
BEGIN
  -- Insert user and get the ID directly using ROWTYPE to avoid ambiguity
  INSERT INTO dashboard.users (account_id, email, first_name, last_name, name, role)
  VALUES (
    p_account_id,
    LOWER(p_email),
    p_first_name,
    p_last_name,
    p_first_name || ' ' || p_last_name,
    p_role
  )
  RETURNING * INTO v_inserted_record;
  
  v_new_user_id := v_inserted_record.id;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role
  FROM dashboard.users u
  WHERE u.id = v_new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user by ID
CREATE OR REPLACE FUNCTION public.get_user_by_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  account_id UUID,
  role TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.account_id,
    u.role,
    u.name,
    u.first_name,
    u.last_name,
    u.created_at,
    u.updated_at,
    u.last_login
  FROM dashboard.users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user last login
CREATE OR REPLACE FUNCTION public.update_user_last_login(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dashboard.users
  SET last_login = NOW()
  WHERE id = p_user_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUTH CODE FUNCTIONS
-- ============================================================================

-- Get recent auth codes for rate limiting
CREATE OR REPLACE FUNCTION public.get_recent_auth_codes(p_email TEXT, p_limit INTEGER DEFAULT 3)
RETURNS TABLE (
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT ac.created_at
  FROM dashboard.auth_codes ac
  WHERE LOWER(ac.email) = LOWER(p_email)
    AND ac.used = false
    AND ac.expires_at > NOW()
  ORDER BY ac.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert auth code
CREATE OR REPLACE FUNCTION public.insert_auth_code(
  p_email TEXT,
  p_code_hash TEXT,
  p_code_salt TEXT,
  p_expires_at TIMESTAMPTZ,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_code_id UUID;
BEGIN
  INSERT INTO dashboard.auth_codes (email, code_hash, code_salt, expires_at, ip_address)
  VALUES (LOWER(p_email), p_code_hash, p_code_salt, p_expires_at, p_ip_address)
  RETURNING id INTO v_code_id;
  
  RETURN v_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get auth code for verification
CREATE OR REPLACE FUNCTION public.get_auth_code_for_verification(p_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  code_hash TEXT,
  code_salt TEXT,
  expires_at TIMESTAMPTZ,
  attempts INTEGER,
  used BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.email,
    ac.code_hash,
    ac.code_salt,
    ac.expires_at,
    ac.attempts,
    ac.used,
    ac.created_at
  FROM dashboard.auth_codes ac
  WHERE LOWER(ac.email) = LOWER(p_email)
    AND ac.used = false
    AND ac.expires_at > NOW()
  ORDER BY ac.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment auth code attempts
CREATE OR REPLACE FUNCTION public.increment_auth_code_attempts(p_code_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dashboard.auth_codes
  SET attempts = attempts + 1
  WHERE id = p_code_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark auth code as used
CREATE OR REPLACE FUNCTION public.mark_auth_code_used(p_code_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dashboard.auth_codes
  SET used = true
  WHERE id = p_code_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SESSION FUNCTIONS
-- ============================================================================

-- Create session
CREATE OR REPLACE FUNCTION public.create_session(
  p_user_id UUID,
  p_token TEXT,
  p_refresh_token TEXT,
  p_expires_at TIMESTAMPTZ,
  p_refresh_expires_at TIMESTAMPTZ,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO dashboard.sessions (
    user_id, token, refresh_token, expires_at, refresh_expires_at, ip_address, user_agent
  )
  VALUES (
    p_user_id, p_token, p_refresh_token, p_expires_at, p_refresh_expires_at, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get session by token
CREATE OR REPLACE FUNCTION public.get_session_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  refresh_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.token,
    s.refresh_token,
    s.expires_at,
    s.refresh_expires_at,
    s.created_at,
    s.ip_address,
    s.user_agent
  FROM dashboard.sessions s
  WHERE s.token = p_token
    AND s.expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete session by token
CREATE OR REPLACE FUNCTION public.delete_session_by_token(p_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM dashboard.sessions WHERE token = p_token;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete session by refresh token
CREATE OR REPLACE FUNCTION public.delete_session_by_refresh_token(p_refresh_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM dashboard.sessions WHERE refresh_token = p_refresh_token;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ACCOUNT FUNCTIONS (move from dashboard to public)
-- ============================================================================

-- Get account by VTEX name
CREATE OR REPLACE FUNCTION public.get_account_by_vtex_name(p_vtex_account_name TEXT)
RETURNS TABLE (
  id UUID,
  vtex_account_name TEXT,
  company_name TEXT,
  plan_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.vtex_account_name,
    a.company_name,
    a.plan_type,
    a.status,
    a.created_at,
    a.updated_at
  FROM customer.accounts a
  WHERE a.vtex_account_name = p_vtex_account_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create account
CREATE OR REPLACE FUNCTION public.create_account(
  p_vtex_account_name TEXT,
  p_company_name TEXT,
  p_plan_type TEXT DEFAULT 'basic',
  p_status TEXT DEFAULT 'active'
)
RETURNS UUID AS $$
DECLARE
  v_account_id UUID;
BEGIN
  INSERT INTO customer.accounts (vtex_account_name, company_name, plan_type, status)
  VALUES (p_vtex_account_name, p_company_name, p_plan_type, p_status)
  RETURNING id INTO v_account_id;
  
  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete account
CREATE OR REPLACE FUNCTION public.delete_account(p_account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM customer.accounts WHERE id = p_account_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role, postgres, anon, authenticated;

