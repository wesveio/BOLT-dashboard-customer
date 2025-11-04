-- ============================================================================
-- Update delete_account function for soft delete with validation
-- ============================================================================
-- Updates the delete_account function to:
-- 1. Accept user_id parameter for validation
-- 2. Validate user has owner or admin role
-- 3. Soft delete: Update account status to 'cancelled' instead of hard delete
-- 4. Cancel all active subscriptions for the account
-- 5. Delete all sessions for users in the account
-- 6. Update updated_at timestamp

CREATE OR REPLACE FUNCTION public.delete_account(
  p_account_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user dashboard.users%ROWTYPE;
  v_account customer.accounts%ROWTYPE;
BEGIN
  -- Get user to validate
  SELECT * INTO v_user
  FROM dashboard.users
  WHERE id = p_user_id;
  
  -- Check if user exists
  IF v_user.id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Verify user belongs to the account
  IF v_user.account_id != p_account_id THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check permissions - only owners and admins can delete accounts
  IF v_user.role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to delete this account';
  END IF;
  
  -- Get account to verify it exists
  SELECT * INTO v_account
  FROM customer.accounts
  WHERE id = p_account_id;
  
  -- Check if account exists
  IF v_account.id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  
  -- Check if account is already cancelled
  IF v_account.status = 'cancelled' THEN
    RAISE EXCEPTION 'Account is already cancelled';
  END IF;
  
  -- Cancel all active subscriptions for the account
  UPDATE dashboard.subscriptions
  SET status = 'cancelled',
      ended_at = NOW(),
      updated_at = NOW()
  WHERE account_id = p_account_id
    AND status = 'active'
    AND (ended_at IS NULL OR ended_at > NOW());
  
  -- Delete all sessions for users in the account
  DELETE FROM dashboard.sessions
  WHERE user_id IN (
    SELECT id FROM dashboard.users
    WHERE account_id = p_account_id
  );
  
  -- Soft delete: Update account status to 'cancelled'
  UPDATE customer.accounts
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = p_account_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_account(UUID, UUID) TO service_role, postgres, authenticated;

