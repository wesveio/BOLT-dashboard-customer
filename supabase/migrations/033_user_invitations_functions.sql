-- ============================================================================
-- USER INVITATIONS FUNCTIONS
-- ============================================================================
-- This migration creates SQL functions for managing user invitations

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get plan user limit
CREATE OR REPLACE FUNCTION public.get_plan_user_limit(p_plan_type TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE p_plan_type
    WHEN 'basic' THEN RETURN 3;
    WHEN 'pro' THEN RETURN 10;
    WHEN 'enterprise' THEN RETURN 20;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_plan_user_limit(TEXT) TO service_role, postgres, authenticated;

-- Get account user count (active users only)
CREATE OR REPLACE FUNCTION public.get_account_user_count(p_account_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM dashboard.users
  WHERE account_id = p_account_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_account_user_count(UUID) TO service_role, postgres, authenticated;

-- ============================================================================
-- USER LISTING FUNCTIONS
-- ============================================================================

-- Get users by account
CREATE OR REPLACE FUNCTION public.get_users_by_account(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.role,
    u.name,
    u.first_name,
    u.last_name,
    u.created_at,
    u.last_login
  FROM dashboard.users u
  WHERE u.account_id = p_account_id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_users_by_account(UUID) TO service_role, postgres, authenticated;

-- ============================================================================
-- INVITATION FUNCTIONS
-- ============================================================================

-- Get user invitations by account
CREATE OR REPLACE FUNCTION public.get_user_invitations_by_account(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  token UUID,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    inv.id,
    inv.email,
    inv.role,
    inv.token,
    inv.expires_at,
    inv.accepted_at,
    inv.created_by,
    inv.created_at,
    CASE
      WHEN inv.accepted_at IS NOT NULL THEN 'accepted'
      WHEN inv.expires_at < NOW() THEN 'expired'
      ELSE 'pending'
    END AS status
  FROM dashboard.user_invitations inv
  WHERE inv.account_id = p_account_id
  ORDER BY inv.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_invitations_by_account(UUID) TO service_role, postgres, authenticated;

-- Create user invitation
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  p_account_id UUID,
  p_email TEXT,
  p_role TEXT,
  p_created_by UUID
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  token UUID,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_invitation_id UUID;
  v_token UUID;
  v_expires_at TIMESTAMPTZ;
  v_inserted_record dashboard.user_invitations%ROWTYPE;
BEGIN
  -- Generate token and expiration (24 hours from now)
  v_token := gen_random_uuid();
  v_expires_at := NOW() + INTERVAL '24 hours';

  -- Insert invitation
  INSERT INTO dashboard.user_invitations (
    account_id,
    email,
    role,
    token,
    expires_at,
    created_by
  )
  VALUES (
    p_account_id,
    LOWER(p_email),
    p_role,
    v_token,
    v_expires_at,
    p_created_by
  )
  RETURNING * INTO v_inserted_record;
  
  v_invitation_id := v_inserted_record.id;
  
  -- Return the created invitation
  RETURN QUERY
  SELECT 
    inv.id,
    inv.email,
    inv.role,
    inv.token,
    inv.expires_at,
    inv.created_at
  FROM dashboard.user_invitations inv
  WHERE inv.id = v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_invitation(UUID, TEXT, TEXT, UUID) TO service_role, postgres, authenticated;

-- Accept user invitation
CREATE OR REPLACE FUNCTION public.accept_user_invitation(p_token UUID)
RETURNS TABLE (
  invitation_id UUID,
  user_id UUID,
  email TEXT,
  account_id UUID,
  role TEXT
) AS $$
DECLARE
  v_invitation dashboard.user_invitations%ROWTYPE;
  v_user_id UUID;
BEGIN
  -- Get invitation by token
  SELECT * INTO v_invitation
  FROM dashboard.user_invitations
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > NOW();
  
  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Check if user already exists with this email
  IF EXISTS (
    SELECT 1 FROM dashboard.users
    WHERE email = v_invitation.email
      AND account_id = v_invitation.account_id
  ) THEN
    RAISE EXCEPTION 'User already exists with this email';
  END IF;
  
  -- Create user
  INSERT INTO dashboard.users (
    account_id,
    email,
    role,
    first_name,
    last_name,
    name
  )
  VALUES (
    v_invitation.account_id,
    v_invitation.email,
    v_invitation.role,
    NULL,
    NULL,
    NULL
  )
  RETURNING id INTO v_user_id;
  
  -- Mark invitation as accepted
  UPDATE dashboard.user_invitations
  SET accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = v_invitation.id;
  
  -- Return results
  RETURN QUERY
  SELECT 
    v_invitation.id,
    v_user_id,
    v_invitation.email,
    v_invitation.account_id,
    v_invitation.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.accept_user_invitation(UUID) TO service_role, postgres, authenticated, anon;

-- Resend user invitation
CREATE OR REPLACE FUNCTION public.resend_user_invitation(p_invitation_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  token UUID,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_new_token UUID;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate new token and expiration (24 hours from now)
  v_new_token := gen_random_uuid();
  v_new_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Update invitation
  UPDATE dashboard.user_invitations
  SET token = v_new_token,
      expires_at = v_new_expires_at,
      updated_at = NOW()
  WHERE id = p_invitation_id
    AND accepted_at IS NULL;
  
  -- Check if invitation was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already accepted';
  END IF;
  
  -- Return updated invitation
  RETURN QUERY
  SELECT 
    inv.id,
    inv.email,
    inv.role,
    inv.token,
    inv.expires_at,
    inv.updated_at
  FROM dashboard.user_invitations inv
  WHERE inv.id = p_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.resend_user_invitation(UUID) TO service_role, postgres, authenticated;

