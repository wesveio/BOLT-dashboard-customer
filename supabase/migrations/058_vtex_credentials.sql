-- ============================================================================
-- VTEX Credentials Schema
-- ============================================================================
-- Stores VTEX App Key and Token per customer account
-- Credentials are encrypted for security

-- ============================================================================
-- VTEX Credentials Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard.vtex_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES customer.accounts(id) ON DELETE CASCADE,
  app_key_encrypted TEXT NOT NULL, -- Encrypted VTEX App Key
  app_token_encrypted TEXT NOT NULL, -- Encrypted VTEX App Token
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT vtex_credentials_app_key_not_empty CHECK (length(app_key_encrypted) > 0),
  CONSTRAINT vtex_credentials_app_token_not_empty CHECK (length(app_token_encrypted) > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vtex_credentials_account_id ON dashboard.vtex_credentials(account_id);

-- Grant permissions for service_role to access the table
GRANT ALL ON dashboard.vtex_credentials TO service_role, postgres;

-- Trigger for updated_at
CREATE TRIGGER update_vtex_credentials_updated_at
  BEFORE UPDATE ON dashboard.vtex_credentials
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE dashboard.vtex_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view VTEX credentials from their account
CREATE POLICY "Users can view account VTEX credentials"
  ON dashboard.vtex_credentials
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Only admin and owner can insert VTEX credentials
CREATE POLICY "Admin and owner can insert VTEX credentials"
  ON dashboard.vtex_credentials
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('admin', 'owner')
    )
  );

-- Only admin and owner can update VTEX credentials
CREATE POLICY "Admin and owner can update VTEX credentials"
  ON dashboard.vtex_credentials
  FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('admin', 'owner')
    )
  );

-- Only admin and owner can delete VTEX credentials
CREATE POLICY "Admin and owner can delete VTEX credentials"
  ON dashboard.vtex_credentials
  FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- RPC Functions
-- ============================================================================

-- Function to get VTEX credentials for a customer account
-- Returns decrypted values for internal use (server-side only)
CREATE OR REPLACE FUNCTION public.get_vtex_credentials(
  p_account_id UUID
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  app_key_encrypted TEXT,
  app_token_encrypted TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.account_id,
    c.app_key_encrypted,
    c.app_token_encrypted,
    c.created_at,
    c.updated_at
  FROM dashboard.vtex_credentials c
  WHERE c.account_id = p_account_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert VTEX credentials
CREATE OR REPLACE FUNCTION public.upsert_vtex_credentials(
  p_account_id UUID,
  p_app_key TEXT,
  p_app_token TEXT
)
RETURNS UUID AS $$
DECLARE
  v_credential_id UUID;
BEGIN
  INSERT INTO dashboard.vtex_credentials (
    account_id,
    app_key_encrypted,
    app_token_encrypted,
    updated_at
  )
  VALUES (
    p_account_id,
    p_app_key, -- Should be encrypted before calling this function
    p_app_token, -- Should be encrypted before calling this function
    NOW()
  )
  ON CONFLICT (account_id) DO UPDATE SET
    app_key_encrypted = EXCLUDED.app_key_encrypted,
    app_token_encrypted = EXCLUDED.app_token_encrypted,
    updated_at = NOW()
  RETURNING id INTO v_credential_id;
  
  RETURN v_credential_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete VTEX credentials
CREATE OR REPLACE FUNCTION public.delete_vtex_credentials(
  p_account_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted BOOLEAN := false;
BEGIN
  DELETE FROM dashboard.vtex_credentials
  WHERE account_id = p_account_id;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant execute permissions on all VTEX credentials functions to required roles

GRANT EXECUTE ON FUNCTION public.get_vtex_credentials(UUID) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_vtex_credentials(UUID, TEXT, TEXT) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_vtex_credentials(UUID) TO service_role, postgres, authenticated;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE dashboard.vtex_credentials IS 'VTEX App Key and Token credentials per customer account';
COMMENT ON COLUMN dashboard.vtex_credentials.app_key_encrypted IS 'Encrypted VTEX App Key (should be decrypted server-side only)';
COMMENT ON COLUMN dashboard.vtex_credentials.app_token_encrypted IS 'Encrypted VTEX App Token (should be decrypted server-side only)';
COMMENT ON FUNCTION public.get_vtex_credentials IS 'Retrieve VTEX credentials for a customer account';
COMMENT ON FUNCTION public.upsert_vtex_credentials IS 'Create or update VTEX credentials for a customer account';
COMMENT ON FUNCTION public.delete_vtex_credentials IS 'Delete VTEX credentials for a customer account';

