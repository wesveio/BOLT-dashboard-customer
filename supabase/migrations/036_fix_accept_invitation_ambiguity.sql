-- ============================================================================
-- Fix accept_user_invitation function - resolve column ambiguity
-- ============================================================================
-- Problem: Column reference "email" is ambiguous in accept_user_invitation function
-- Solution: Qualify all column references with table aliases

-- Fix accept_user_invitation function to resolve ambiguity
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
  -- Get invitation by token - use explicit casting for UUID comparison
  SELECT * INTO v_invitation
  FROM dashboard.user_invitations
  WHERE dashboard.user_invitations.token::text = p_token::text
    AND dashboard.user_invitations.accepted_at IS NULL
    AND dashboard.user_invitations.expires_at > NOW();
  
  -- Check if invitation exists and is valid
  IF v_invitation.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Check if user already exists with this email - qualify column references
  IF EXISTS (
    SELECT 1 FROM dashboard.users u
    WHERE u.email = v_invitation.email
      AND u.account_id = v_invitation.account_id
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
  RETURNING dashboard.users.id INTO v_user_id;
  
  -- Mark invitation as accepted - qualify column references
  UPDATE dashboard.user_invitations
  SET accepted_at = NOW(),
      updated_at = NOW()
  WHERE dashboard.user_invitations.id = v_invitation.id;
  
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

