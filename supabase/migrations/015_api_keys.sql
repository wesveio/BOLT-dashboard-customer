-- ============================================================================
-- API KEYS TABLE
-- ============================================================================
-- Table for storing API keys for integrations
-- Keys are hashed using SHA-256 with salt for security

CREATE TABLE dashboard.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE NOT NULL,
  key_type TEXT NOT NULL, -- 'metrics' or 'custom'
  name TEXT, -- Custom name for API keys (null for metrics type)
  description TEXT, -- Description for custom API keys
  key_hash TEXT NOT NULL, -- Hashed API key using SHA-256 with salt
  key_prefix TEXT NOT NULL, -- First 8 characters for display
  key_suffix TEXT NOT NULL, -- Last 4 characters for display
  last_used_at TIMESTAMPTZ, -- Track when key was last used
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES dashboard.users(id),
  
  -- Constraints
  CONSTRAINT check_key_type CHECK (key_type IN ('metrics', 'custom')),
  CONSTRAINT check_name_not_empty CHECK (key_type = 'custom' AND name IS NOT NULL AND length(name) > 0 OR key_type = 'metrics'),
  CONSTRAINT unique_metrics_key_per_account UNIQUE (account_id, key_type) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for performance
CREATE INDEX idx_api_keys_account_id ON dashboard.api_keys (account_id);
CREATE INDEX idx_api_keys_key_type ON dashboard.api_keys (key_type);
CREATE INDEX idx_api_keys_last_used ON dashboard.api_keys (last_used_at DESC);
CREATE INDEX idx_api_keys_account_type ON dashboard.api_keys (account_id, key_type);

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON dashboard.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE dashboard.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view API keys from their account
CREATE POLICY "Users can view account API keys"
  ON dashboard.api_keys
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Only admin and owner can create API keys
CREATE POLICY "Admin and owner can create API keys"
  ON dashboard.api_keys
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('admin', 'owner')
    )
  );

-- Only admin and owner can update API keys
CREATE POLICY "Admin and owner can update API keys"
  ON dashboard.api_keys
  FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('admin', 'owner')
    )
  );

-- Only admin and owner can delete API keys
CREATE POLICY "Admin and owner can delete API keys"
  ON dashboard.api_keys
  FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- PUBLIC FUNCTIONS FOR API KEYS
-- ============================================================================
-- These functions expose dashboard.api_keys table through public schema

-- Get API keys by account_id
CREATE OR REPLACE FUNCTION public.get_api_keys_by_account(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  key_type TEXT,
  name TEXT,
  description TEXT,
  key_prefix TEXT,
  key_suffix TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id,
    k.account_id,
    k.key_type,
    k.name,
    k.description,
    k.key_prefix,
    k.key_suffix,
    k.last_used_at,
    k.created_at,
    k.updated_at,
    k.created_by
  FROM dashboard.api_keys k
  WHERE k.account_id = p_account_id
  ORDER BY 
    CASE k.key_type 
      WHEN 'metrics' THEN 0 
      ELSE 1 
    END,
    k.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get metrics API key by account_id
CREATE OR REPLACE FUNCTION public.get_metrics_api_key(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  key_type TEXT,
  key_prefix TEXT,
  key_suffix TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id,
    k.account_id,
    k.key_type,
    k.key_prefix,
    k.key_suffix,
    k.last_used_at,
    k.created_at,
    k.updated_at
  FROM dashboard.api_keys k
  WHERE k.account_id = p_account_id
    AND k.key_type = 'metrics'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or update metrics API key
CREATE OR REPLACE FUNCTION public.upsert_metrics_api_key(
  p_account_id UUID,
  p_key_hash TEXT,
  p_key_prefix TEXT,
  p_key_suffix TEXT,
  p_created_by UUID
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  key_type TEXT,
  key_prefix TEXT,
  key_suffix TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_key_id UUID;
BEGIN
  -- Try to update existing metrics key
  UPDATE dashboard.api_keys
  SET 
    key_hash = p_key_hash,
    key_prefix = p_key_prefix,
    key_suffix = p_key_suffix,
    updated_at = NOW()
  WHERE account_id = p_account_id
    AND key_type = 'metrics'
  RETURNING id INTO v_key_id;
  
  -- If no existing key, create new one
  IF v_key_id IS NULL THEN
    INSERT INTO dashboard.api_keys (
      account_id,
      key_type,
      key_hash,
      key_prefix,
      key_suffix,
      created_by
    )
    VALUES (
      p_account_id,
      'metrics',
      p_key_hash,
      p_key_prefix,
      p_key_suffix,
      p_created_by
    )
    RETURNING id INTO v_key_id;
  END IF;
  
  RETURN QUERY
  SELECT 
    k.id,
    k.account_id,
    k.key_type,
    k.key_prefix,
    k.key_suffix,
    k.created_at,
    k.updated_at
  FROM dashboard.api_keys k
  WHERE k.id = v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create custom API key
CREATE OR REPLACE FUNCTION public.create_custom_api_key(
  p_account_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_key_hash TEXT,
  p_key_prefix TEXT,
  p_key_suffix TEXT,
  p_created_by UUID
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  key_type TEXT,
  name TEXT,
  description TEXT,
  key_prefix TEXT,
  key_suffix TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
DECLARE
  v_key_id UUID;
BEGIN
  INSERT INTO dashboard.api_keys (
    account_id,
    key_type,
    name,
    description,
    key_hash,
    key_prefix,
    key_suffix,
    created_by
  )
  VALUES (
    p_account_id,
    'custom',
    p_name,
    p_description,
    p_key_hash,
    p_key_prefix,
    p_key_suffix,
    p_created_by
  )
  RETURNING id INTO v_key_id;
  
  RETURN QUERY
  SELECT 
    k.id,
    k.account_id,
    k.key_type,
    k.name,
    k.description,
    k.key_prefix,
    k.key_suffix,
    k.created_at,
    k.updated_at,
    k.created_by
  FROM dashboard.api_keys k
  WHERE k.id = v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete API key by id (only custom keys)
CREATE OR REPLACE FUNCTION public.delete_api_key(
  p_key_id UUID,
  p_account_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted BOOLEAN := false;
BEGIN
  DELETE FROM dashboard.api_keys
  WHERE id = p_key_id
    AND account_id = p_account_id
    AND key_type = 'custom';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify API key (for use in API routes that need to validate keys)
CREATE OR REPLACE FUNCTION public.verify_api_key(
  p_key_value TEXT,
  p_account_id UUID
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  key_type TEXT,
  name TEXT
) AS $$
DECLARE
  v_key_prefix TEXT;
  v_key_suffix TEXT;
BEGIN
  -- Extract prefix and suffix from key value
  v_key_prefix := LEFT(p_key_value, 8);
  v_key_suffix := RIGHT(p_key_value, 4);
  
  -- Find matching key by prefix and suffix
  RETURN QUERY
  SELECT 
    k.id,
    k.account_id,
    k.key_type,
    k.name
  FROM dashboard.api_keys k
  WHERE k.account_id = p_account_id
    AND k.key_prefix = v_key_prefix
    AND k.key_suffix = v_key_suffix
    -- Note: Actual verification should be done in application code
    -- using the stored hash. This function just finds the key.
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant execute permissions on all API key functions to required roles

GRANT EXECUTE ON FUNCTION public.get_api_keys_by_account(UUID) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.get_metrics_api_key(UUID) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_metrics_api_key(UUID, TEXT, TEXT, TEXT, UUID) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.create_custom_api_key(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_api_key(UUID, UUID) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_api_key(TEXT, UUID) TO service_role, postgres, authenticated;

