-- ============================================================================
-- Add delete_user function for safe user deletion
-- ============================================================================
-- Creates a function to delete users with proper validation and permissions

-- Function to delete a user by ID
CREATE OR REPLACE FUNCTION public.delete_user(
  p_user_id UUID, 
  p_deleter_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_to_delete dashboard.users%ROWTYPE;
  v_deleter_user dashboard.users%ROWTYPE;
  v_owner_count INTEGER;
BEGIN
  -- Get user to delete
  SELECT * INTO v_user_to_delete
  FROM dashboard.users
  WHERE dashboard.users.id = p_user_id;
  
  -- Check if user exists
  IF v_user_to_delete.id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Get deleter user
  SELECT * INTO v_deleter_user
  FROM dashboard.users
  WHERE dashboard.users.id = p_deleter_user_id;
  
  -- Check if deleter user exists
  IF v_deleter_user.id IS NULL THEN
    RAISE EXCEPTION 'Deleter user not found';
  END IF;
  
  -- Verify users belong to same account
  IF v_user_to_delete.account_id != v_deleter_user.account_id THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check if trying to delete self
  IF v_user_to_delete.id = v_deleter_user.id THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;
  
  -- Check permissions - only owners can delete, and admins can delete non-owners
  IF v_deleter_user.role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to delete this user';
  END IF;
  
  -- If deleter is admin, cannot delete owners
  IF v_deleter_user.role = 'admin' AND v_user_to_delete.role = 'owner' THEN
    RAISE EXCEPTION 'Insufficient permissions to delete this user';
  END IF;
  
  -- Check if this is the last owner
  IF v_user_to_delete.role = 'owner' THEN
    SELECT COUNT(*) INTO v_owner_count
    FROM dashboard.users
    WHERE dashboard.users.account_id = v_deleter_user.account_id
      AND dashboard.users.role = 'owner';
    
    IF v_owner_count <= 1 THEN
      RAISE EXCEPTION 'Cannot delete the last owner of the account';
    END IF;
  END IF;
  
  -- Delete user
  DELETE FROM dashboard.users
  WHERE dashboard.users.id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_user(UUID, UUID) TO service_role, postgres, authenticated;


