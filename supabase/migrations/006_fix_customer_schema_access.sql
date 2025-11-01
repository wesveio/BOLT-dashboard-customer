-- ============================================================================
-- Migration: Fix customer schema access for PostgREST
-- ============================================================================
-- Problem: PostgREST only exposes 'public' and 'graphql_public' schemas
-- Solution: Create views and functions in 'dashboard' schema to access customer.accounts
-- ============================================================================

-- Grant usage on customer schema to service_role
GRANT USAGE ON SCHEMA customer TO service_role, postgres;
GRANT ALL ON customer.accounts TO service_role, postgres;

-- Create a view in dashboard schema to access accounts (read-only)
-- This allows PostgREST to query accounts through dashboard schema
CREATE OR REPLACE VIEW dashboard.accounts AS
SELECT * FROM customer.accounts;

-- Grant access to the view
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard.accounts TO service_role, postgres;

-- Note: Views don't support INSERT directly, so we'll use functions instead
-- Create function to insert account
CREATE OR REPLACE FUNCTION dashboard.create_account(
  p_vtex_account_name TEXT,
  p_company_name TEXT,
  p_plan_type TEXT DEFAULT 'basic',
  p_status TEXT DEFAULT 'active'
)
RETURNS UUID AS $$
DECLARE
  v_account_id UUID;
BEGIN
  INSERT INTO customer.accounts (vtex_account_name, company_name, plan_type, status)
  VALUES (p_vtex_account_name, p_company_name, p_plan_type, p_status)
  RETURNING id INTO v_account_id;
  
  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get account by vtex_account_name
CREATE OR REPLACE FUNCTION dashboard.get_account_by_vtex_name(p_vtex_account_name TEXT)
RETURNS TABLE (
  id UUID,
  vtex_account_name TEXT,
  company_name TEXT,
  plan_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.vtex_account_name,
    a.company_name,
    a.plan_type,
    a.status,
    a.created_at,
    a.updated_at
  FROM customer.accounts a
  WHERE a.vtex_account_name = p_vtex_account_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete account
CREATE OR REPLACE FUNCTION dashboard.delete_account(p_account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM customer.accounts WHERE id = p_account_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION dashboard.create_account TO service_role, postgres;
GRANT EXECUTE ON FUNCTION dashboard.get_account_by_vtex_name TO service_role, postgres;
GRANT EXECUTE ON FUNCTION dashboard.delete_account TO service_role, postgres;

