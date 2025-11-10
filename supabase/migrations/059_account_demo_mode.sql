-- ============================================================================
-- Migration: Add Demo Mode and Onboarding Fields to Accounts
-- ============================================================================
-- Adds fields to support demo mode (accounts without active subscriptions)
-- and onboarding tracking
-- ============================================================================

-- Add demo_mode field (default true - accounts start in demo mode)
ALTER TABLE customer.accounts
  ADD COLUMN IF NOT EXISTS demo_mode BOOLEAN NOT NULL DEFAULT true;

-- Add onboarding_required field (default true - onboarding needed)
ALTER TABLE customer.accounts
  ADD COLUMN IF NOT EXISTS onboarding_required BOOLEAN NOT NULL DEFAULT true;

-- Update status constraint to include 'trial'
-- First, drop the existing constraint
ALTER TABLE customer.accounts
  DROP CONSTRAINT IF EXISTS check_status;

-- Add new constraint with 'trial' status
ALTER TABLE customer.accounts
  ADD CONSTRAINT check_status CHECK (status IN ('trial', 'active', 'suspended', 'cancelled'));

-- Update existing accounts without active subscriptions to 'trial' status
-- This is a one-time migration for existing data
UPDATE customer.accounts
SET 
  status = 'trial',
  demo_mode = true,
  onboarding_required = true
WHERE id NOT IN (
  SELECT DISTINCT account_id 
  FROM dashboard.subscriptions 
  WHERE status = 'active'
);

-- Create index for demo_mode queries (for performance)
CREATE INDEX IF NOT EXISTS idx_accounts_demo_mode ON customer.accounts(demo_mode) WHERE demo_mode = true;

-- Create index for onboarding_required queries
CREATE INDEX IF NOT EXISTS idx_accounts_onboarding_required ON customer.accounts(onboarding_required) WHERE onboarding_required = true;

-- Create function to update demo_mode based on subscription status
CREATE OR REPLACE FUNCTION customer.update_account_demo_mode(p_account_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_active_subscription BOOLEAN;
BEGIN
  -- Check if account has active subscription
  SELECT EXISTS(
    SELECT 1 
    FROM dashboard.subscriptions 
    WHERE account_id = p_account_id 
      AND status = 'active'
  ) INTO v_has_active_subscription;

  -- Update account
  UPDATE customer.accounts
  SET 
    demo_mode = NOT v_has_active_subscription,
    status = CASE 
      WHEN v_has_active_subscription THEN 'active'
      WHEN status = 'active' THEN 'trial'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_account_id;

  RETURN NOT v_has_active_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION customer.update_account_demo_mode(UUID) TO service_role, postgres;

-- Create trigger to automatically update demo_mode when subscription changes
-- This will be called manually from application code when subscriptions change
-- (We don't create an automatic trigger to avoid circular dependencies)

-- Add comment to explain the fields
COMMENT ON COLUMN customer.accounts.demo_mode IS 'True if account is in demo mode (no active subscription). Accounts in demo mode see mock data.';
COMMENT ON COLUMN customer.accounts.onboarding_required IS 'True if account needs onboarding. Onboarding is triggered when first subscription is activated.';
COMMENT ON COLUMN customer.accounts.status IS 'Account status: trial (no subscription), active (has subscription), suspended, or cancelled';

