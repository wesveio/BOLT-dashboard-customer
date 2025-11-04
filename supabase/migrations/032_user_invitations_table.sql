-- ============================================================================
-- USER INVITATIONS TABLE
-- ============================================================================
-- This migration creates the user_invitations table for managing user invites
-- with expiration and role assignment

-- Create user_invitations table
CREATE TABLE dashboard.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'owner' | 'admin' | 'editor' | 'viewer'
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES dashboard.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_invitation_role CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  CONSTRAINT check_invitation_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT check_invitation_expires CHECK (expires_at > created_at),
  CONSTRAINT check_invitation_not_accepted CHECK (accepted_at IS NULL OR accepted_at > created_at)
);

-- Create indexes for performance
CREATE INDEX idx_user_invitations_account_id ON dashboard.user_invitations (account_id);
CREATE INDEX idx_user_invitations_token ON dashboard.user_invitations (token);
CREATE INDEX idx_user_invitations_email ON dashboard.user_invitations (email);
CREATE INDEX idx_user_invitations_expires_at ON dashboard.user_invitations (expires_at);
CREATE INDEX idx_user_invitations_status ON dashboard.user_invitations (account_id, accepted_at, expires_at);

-- Unique constraint: one pending invitation per email per account
CREATE UNIQUE INDEX idx_user_invitations_unique_pending 
ON dashboard.user_invitations (account_id, email) 
WHERE accepted_at IS NULL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION dashboard.update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_invitations_updated_at
  BEFORE UPDATE ON dashboard.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_user_invitations_updated_at();

-- Enable RLS
ALTER TABLE dashboard.user_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR USER INVITATIONS
-- ============================================================================

-- Users can view invitations from their account
CREATE POLICY "Users can view account invitations"
  ON dashboard.user_invitations
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Only owners and admins can create invitations
CREATE POLICY "Owners and admins can create invitations"
  ON dashboard.user_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('owner', 'admin')
      AND account_id = dashboard.user_invitations.account_id
    )
  );

-- Only owners and admins can update invitations
CREATE POLICY "Owners and admins can update invitations"
  ON dashboard.user_invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('owner', 'admin')
      AND account_id = dashboard.user_invitations.account_id
    )
  );

-- Only owners and admins can delete invitations
CREATE POLICY "Owners and admins can delete invitations"
  ON dashboard.user_invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('owner', 'admin')
      AND account_id = dashboard.user_invitations.account_id
    )
  );

-- Grant execute permission
GRANT EXECUTE ON FUNCTION dashboard.update_user_invitations_updated_at() TO service_role, postgres, authenticated;

