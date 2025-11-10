-- ============================================================================
-- Migration: Deployments Table
-- ============================================================================
-- Creates table to track Netlify deployments for accounts
-- Supports both shared (multi-tenant) and dedicated (Enterprise) deployments
-- ============================================================================

-- ============================================================================
-- DEPLOYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE NOT NULL UNIQUE,
  deployment_type TEXT NOT NULL, -- 'shared' or 'dedicated'
  platform TEXT NOT NULL DEFAULT 'netlify', -- Always 'netlify' for now
  netlify_site_id TEXT, -- Netlify site ID (for dedicated deployments)
  deployment_id TEXT, -- Specific deployment ID (for tracking builds)
  url TEXT NOT NULL, -- Deployment URL
  custom_domain TEXT, -- Custom domain (for Enterprise)
  github_repo TEXT, -- GitHub repository (owner/repo)
  github_branch TEXT DEFAULT 'main', -- Branch to deploy
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'building', 'ready', 'failed'
  env_vars JSONB DEFAULT '{}'::jsonb, -- Encrypted environment variables
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_deployment_type CHECK (deployment_type IN ('shared', 'dedicated')),
  CONSTRAINT check_platform CHECK (platform = 'netlify'),
  CONSTRAINT check_status CHECK (status IN ('pending', 'building', 'ready', 'failed'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deployments_account ON dashboard.deployments(account_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON dashboard.deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_netlify_site ON dashboard.deployments(netlify_site_id) WHERE netlify_site_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_deployments_updated_at
  BEFORE UPDATE ON dashboard.deployments
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE dashboard.deployments ENABLE ROW LEVEL SECURITY;

-- Users can view deployments for their account
CREATE POLICY "Users can view account deployments"
  ON dashboard.deployments
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Only admin and owner can manage deployments
CREATE POLICY "Admin and owner can manage deployments"
  ON dashboard.deployments
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- PUBLIC FUNCTIONS FOR DEPLOYMENTS
-- ============================================================================

-- Get deployment by account_id
CREATE OR REPLACE FUNCTION public.get_deployment_by_account(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  deployment_type TEXT,
  platform TEXT,
  netlify_site_id TEXT,
  url TEXT,
  custom_domain TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.account_id,
    d.deployment_type,
    d.platform,
    d.netlify_site_id,
    d.url,
    d.custom_domain,
    d.status,
    d.created_at,
    d.updated_at
  FROM dashboard.deployments d
  WHERE d.account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or update deployment
CREATE OR REPLACE FUNCTION public.upsert_deployment(
  p_account_id UUID,
  p_deployment_type TEXT,
  p_url TEXT,
  p_netlify_site_id TEXT DEFAULT NULL,
  p_custom_domain TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pending',
  p_env_vars JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_deployment_id UUID;
BEGIN
  -- Try to update existing deployment
  UPDATE dashboard.deployments
  SET 
    deployment_type = p_deployment_type,
    url = p_url,
    netlify_site_id = COALESCE(p_netlify_site_id, netlify_site_id),
    custom_domain = COALESCE(p_custom_domain, custom_domain),
    status = p_status,
    env_vars = p_env_vars,
    updated_at = NOW()
  WHERE account_id = p_account_id
  RETURNING id INTO v_deployment_id;
  
  -- If no existing deployment, create new one
  IF v_deployment_id IS NULL THEN
    INSERT INTO dashboard.deployments (
      account_id,
      deployment_type,
      url,
      netlify_site_id,
      custom_domain,
      status,
      env_vars
    )
    VALUES (
      p_account_id,
      p_deployment_type,
      p_url,
      p_netlify_site_id,
      p_custom_domain,
      p_status,
      p_env_vars
    )
    RETURNING id INTO v_deployment_id;
  END IF;
  
  RETURN v_deployment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_deployment_by_account(UUID) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_deployment(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role, postgres;

-- Add comments
COMMENT ON TABLE dashboard.deployments IS 'Tracks Netlify deployments for accounts. Shared deployments use subdomain routing, dedicated deployments have isolated sites.';
COMMENT ON COLUMN dashboard.deployments.deployment_type IS 'shared: multi-tenant subdomain, dedicated: isolated Enterprise deployment';
COMMENT ON COLUMN dashboard.deployments.env_vars IS 'Environment variables for the deployment (encrypted in application layer)';

