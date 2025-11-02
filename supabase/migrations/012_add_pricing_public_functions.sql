-- ============================================================================
-- Migration: Add public functions for pricing system
-- ============================================================================
-- Problem: PostgREST only exposes 'public' schema
-- Solution: Create SQL functions in 'public' schema that access 'dashboard' tables
-- ============================================================================

-- ============================================================================
-- PUBLIC FUNCTIONS FOR POSTGREST ACCESS
-- ============================================================================
-- PostgREST only exposes 'public' schema, so we create wrapper functions

-- Get all active plans
CREATE OR REPLACE FUNCTION public.get_plans()
RETURNS TABLE (
  id UUID,
  name TEXT,
  code TEXT,
  monthly_price NUMERIC,
  transaction_fee_percent NUMERIC,
  features JSONB,
  is_active BOOLEAN,
  display_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.code,
    p.monthly_price,
    p.transaction_fee_percent,
    p.features,
    p.is_active,
    p.display_order,
    p.created_at,
    p.updated_at
  FROM dashboard.plans p
  WHERE p.is_active = true
  ORDER BY p.display_order ASC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get subscriptions by account ID
CREATE OR REPLACE FUNCTION public.get_subscriptions_by_account(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  plan_id UUID,
  status TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  billing_cycle TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  plan JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.account_id,
    s.plan_id,
    s.status,
    s.started_at,
    s.ended_at,
    s.billing_cycle,
    s.created_at,
    s.updated_at,
    to_jsonb(p.*) as plan
  FROM dashboard.subscriptions s
  JOIN dashboard.plans p ON s.plan_id = p.id
  WHERE s.account_id = p_account_id
  ORDER BY s.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get subscription transactions by subscription IDs
CREATE OR REPLACE FUNCTION public.get_subscription_transactions(p_subscription_ids UUID[])
RETURNS TABLE (
  id UUID,
  subscription_id UUID,
  amount NUMERIC,
  currency TEXT,
  transaction_date TIMESTAMPTZ,
  status TEXT,
  transaction_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id,
    st.subscription_id,
    st.amount,
    st.currency,
    st.transaction_date,
    st.status,
    st.transaction_type,
    st.metadata,
    st.created_at
  FROM dashboard.subscription_transactions st
  WHERE st.subscription_id = ANY(p_subscription_ids)
  ORDER BY st.transaction_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_plans() TO service_role, postgres, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscriptions_by_account(UUID) TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_transactions(UUID[]) TO service_role, postgres, authenticated;

