-- ============================================================================
-- Fix resend_user_invitation function - resolve column ambiguity
-- ============================================================================
-- Problem: Column reference "id" is ambiguous in resend_user_invitation function
-- Solution: Qualify all column references with table alias

-- Fix resend_user_invitation function to resolve ambiguity
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
  
  -- Update invitation - qualify column reference with table name
  UPDATE dashboard.user_invitations
  SET token = v_new_token,
      expires_at = v_new_expires_at,
      updated_at = NOW()
  WHERE dashboard.user_invitations.id = p_invitation_id
    AND dashboard.user_invitations.accepted_at IS NULL;
  
  -- Check if invitation was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already accepted';
  END IF;
  
  -- Return updated invitation - use table alias to avoid ambiguity
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

