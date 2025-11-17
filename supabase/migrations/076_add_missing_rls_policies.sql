-- ============================================================================
-- Migration: Add missing RLS policies for auth tables
-- ============================================================================
-- Problem: Supabase linter detected RLS enabled but no policies on:
--   - dashboard.auth_codes
--   - dashboard.sessions
--   - dashboard.theme_versions
-- Solution: Add explicit RLS policies that deny direct access
-- Note: These tables are accessed via SECURITY DEFINER functions which bypass RLS
-- ============================================================================

-- ============================================================================
-- DASHBOARD.AUTH_CODES POLICIES
-- ============================================================================
-- Auth codes should only be accessed via SECURITY DEFINER functions
-- Deny all direct access to ensure security

-- Deny SELECT access (access only via functions)
CREATE POLICY "Deny direct access to auth_codes"
  ON dashboard.auth_codes
  FOR SELECT
  USING (false);

-- Deny INSERT access (access only via functions)
CREATE POLICY "Deny direct insert to auth_codes"
  ON dashboard.auth_codes
  FOR INSERT
  WITH CHECK (false);

-- Deny UPDATE access (access only via functions)
CREATE POLICY "Deny direct update to auth_codes"
  ON dashboard.auth_codes
  FOR UPDATE
  USING (false);

-- Deny DELETE access (access only via functions)
CREATE POLICY "Deny direct delete to auth_codes"
  ON dashboard.auth_codes
  FOR DELETE
  USING (false);

-- ============================================================================
-- DASHBOARD.SESSIONS POLICIES
-- ============================================================================
-- Sessions should only be accessed via SECURITY DEFINER functions
-- Deny all direct access to ensure security

-- Deny SELECT access (access only via functions)
CREATE POLICY "Deny direct access to sessions"
  ON dashboard.sessions
  FOR SELECT
  USING (false);

-- Deny INSERT access (access only via functions)
CREATE POLICY "Deny direct insert to sessions"
  ON dashboard.sessions
  FOR INSERT
  WITH CHECK (false);

-- Deny UPDATE access (access only via functions)
CREATE POLICY "Deny direct update to sessions"
  ON dashboard.sessions
  FOR UPDATE
  USING (false);

-- Deny DELETE access (access only via functions)
CREATE POLICY "Deny direct delete to sessions"
  ON dashboard.sessions
  FOR DELETE
  USING (false);

-- ============================================================================
-- DASHBOARD.THEME_VERSIONS POLICIES
-- ============================================================================
-- Theme versions should be accessible based on account_id via theme_configs
-- Users can view theme versions for themes that belong to their account

-- Users can view theme versions for themes in their account
CREATE POLICY "Users can view account theme versions"
  ON dashboard.theme_versions
  FOR SELECT
  USING (
    theme_id IN (
      SELECT id FROM dashboard.theme_configs
      WHERE account_id IN (
        SELECT account_id FROM dashboard.users
        WHERE id = auth.uid()::UUID
      )
    )
  );

-- Editors, admins, and owners can create theme versions
CREATE POLICY "Editors+ can create theme versions"
  ON dashboard.theme_versions
  FOR INSERT
  WITH CHECK (
    theme_id IN (
      SELECT id FROM dashboard.theme_configs
      WHERE account_id IN (
        SELECT account_id FROM dashboard.users
        WHERE id = auth.uid()::UUID
        AND role IN ('editor', 'admin', 'owner')
      )
    )
  );

-- Editors, admins, and owners can update theme versions
CREATE POLICY "Editors+ can update theme versions"
  ON dashboard.theme_versions
  FOR UPDATE
  USING (
    theme_id IN (
      SELECT id FROM dashboard.theme_configs
      WHERE account_id IN (
        SELECT account_id FROM dashboard.users
        WHERE id = auth.uid()::UUID
        AND role IN ('editor', 'admin', 'owner')
      )
    )
  );

-- Admins and owners can delete theme versions
CREATE POLICY "Admins+ can delete theme versions"
  ON dashboard.theme_versions
  FOR DELETE
  USING (
    theme_id IN (
      SELECT id FROM dashboard.theme_configs
      WHERE account_id IN (
        SELECT account_id FROM dashboard.users
        WHERE id = auth.uid()::UUID
        AND role IN ('admin', 'owner')
      )
    )
  );

