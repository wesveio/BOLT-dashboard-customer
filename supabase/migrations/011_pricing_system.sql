-- ============================================================================
-- PRICING SYSTEM MIGRATION
-- ============================================================================
-- This migration creates tables and updates schema for pricing plans,
-- subscriptions, and transaction history

-- ============================================================================
-- PLANS TABLE
-- ============================================================================
-- Stores plan definitions (Starter, Professional, Enterprise)
CREATE TABLE dashboard.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- 'starter', 'professional', 'enterprise'
  monthly_price NUMERIC(10, 2) NOT NULL,
  transaction_fee_percent NUMERIC(5, 2) NOT NULL, -- 1.00 = 1%, 0.50 = 0.5%
  features JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of feature codes/names
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_monthly_price_positive CHECK (monthly_price >= 0),
  CONSTRAINT check_transaction_fee_valid CHECK (transaction_fee_percent >= 0 AND transaction_fee_percent <= 100),
  CONSTRAINT check_code_format CHECK (code ~* '^[a-z0-9_-]+$')
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
-- Stores subscription history and current subscriptions
CREATE TABLE dashboard.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES customer.accounts(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES dashboard.plans(id) ON DELETE RESTRICT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'active', 'cancelled', 'expired', 'pending'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_subscription_status CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  CONSTRAINT check_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly')),
  CONSTRAINT check_dates_valid CHECK (ended_at IS NULL OR ended_at > started_at)
);

-- ============================================================================
-- SUBSCRIPTION TRANSACTIONS TABLE
-- ============================================================================
-- Stores payment/transaction history for subscriptions
CREATE TABLE dashboard.subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES dashboard.subscriptions(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending', -- 'completed', 'pending', 'failed', 'refunded'
  transaction_type TEXT NOT NULL, -- 'subscription', 'upgrade', 'downgrade', 'refund'
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional transaction data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_amount_positive CHECK (amount >= 0),
  CONSTRAINT check_status_valid CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  CONSTRAINT check_transaction_type CHECK (transaction_type IN ('subscription', 'upgrade', 'downgrade', 'refund'))
);

-- ============================================================================
-- UPDATE CUSTOMER.ACCOUNTS TABLE
-- ============================================================================
-- Add fields for subscription management and regional pricing
ALTER TABLE customer.accounts
  ADD COLUMN IF NOT EXISTS current_subscription_id UUID REFERENCES dashboard.subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS billing_email TEXT;

-- Add constraint for currency format (ISO 4217 codes)
-- Note: PostgreSQL doesn't support IF NOT EXISTS for constraints, so we check first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_currency_format' 
    AND conrelid = 'customer.accounts'::regclass
  ) THEN
    ALTER TABLE customer.accounts
      ADD CONSTRAINT check_currency_format CHECK (currency ~* '^[A-Z]{3}$');
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Plans indexes
CREATE INDEX idx_plans_code ON dashboard.plans (code);
CREATE INDEX idx_plans_active ON dashboard.plans (is_active) WHERE is_active = true;
CREATE INDEX idx_plans_display_order ON dashboard.plans (display_order);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_account ON dashboard.subscriptions (account_id);
CREATE INDEX idx_subscriptions_plan ON dashboard.subscriptions (plan_id);
CREATE INDEX idx_subscriptions_status ON dashboard.subscriptions (status);
CREATE INDEX idx_subscriptions_active ON dashboard.subscriptions (account_id, status) WHERE status = 'active';
CREATE INDEX idx_subscriptions_dates ON dashboard.subscriptions (account_id, started_at DESC, ended_at DESC);

-- Subscription transactions indexes
CREATE INDEX idx_subscription_transactions_subscription ON dashboard.subscription_transactions (subscription_id);
CREATE INDEX idx_subscription_transactions_date ON dashboard.subscription_transactions (transaction_date DESC);
CREATE INDEX idx_subscription_transactions_status ON dashboard.subscription_transactions (status);

-- Accounts indexes for new fields
CREATE INDEX idx_accounts_subscription ON customer.accounts (current_subscription_id) WHERE current_subscription_id IS NOT NULL;
CREATE INDEX idx_accounts_currency ON customer.accounts (currency);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Trigger for plans.updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON dashboard.plans
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

-- Trigger for subscriptions.updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON dashboard.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION dashboard.update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get current active subscription for an account
CREATE OR REPLACE FUNCTION dashboard.get_current_subscription(p_account_id UUID)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  plan_id UUID,
  plan_name TEXT,
  plan_code TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  billing_cycle TEXT,
  monthly_price NUMERIC,
  transaction_fee_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.account_id,
    s.plan_id,
    p.name AS plan_name,
    p.code AS plan_code,
    s.status,
    s.started_at,
    s.ended_at,
    s.billing_cycle,
    p.monthly_price,
    p.transaction_fee_percent
  FROM dashboard.subscriptions s
  JOIN dashboard.plans p ON s.plan_id = p.id
  WHERE s.account_id = p_account_id
    AND s.status = 'active'
    AND (s.ended_at IS NULL OR s.ended_at > NOW())
  ORDER BY s.started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION dashboard.get_current_subscription(UUID) TO service_role, postgres, authenticated;

-- Function to create a new subscription
CREATE OR REPLACE FUNCTION dashboard.create_subscription(
  p_account_id UUID,
  p_plan_id UUID,
  p_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
BEGIN
  -- Cancel any existing active subscriptions
  UPDATE dashboard.subscriptions
  SET status = 'cancelled',
      ended_at = NOW(),
      updated_at = NOW()
  WHERE account_id = p_account_id
    AND status = 'active'
    AND (ended_at IS NULL OR ended_at > NOW());

  -- Create new subscription
  INSERT INTO dashboard.subscriptions (account_id, plan_id, billing_cycle, status)
  VALUES (p_account_id, p_plan_id, p_billing_cycle, 'active')
  RETURNING id INTO v_subscription_id;

  -- Update account's current subscription
  UPDATE customer.accounts
  SET current_subscription_id = v_subscription_id,
      updated_at = NOW()
  WHERE id = p_account_id;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION dashboard.create_subscription(UUID, UUID, TEXT) TO service_role, postgres, authenticated;

-- ============================================================================
-- SEED DATA: INITIAL PLANS
-- ============================================================================

-- Insert Starter plan
INSERT INTO dashboard.plans (name, code, monthly_price, transaction_fee_percent, features, display_order)
VALUES (
  'Starter',
  'starter',
  200.00,
  1.00,
  '["bolt_core", "boltflow_basic"]'::jsonb,
  1
) ON CONFLICT (code) DO NOTHING;

-- Insert Professional plan
INSERT INTO dashboard.plans (name, code, monthly_price, transaction_fee_percent, features, display_order)
VALUES (
  'Professional',
  'professional',
  500.00,
  0.80,
  '["bolt_core", "boltflow_complete", "boltguard", "boltmetrics"]'::jsonb,
  2
) ON CONFLICT (code) DO NOTHING;

-- Insert Enterprise plan (no fixed price, contact sales)
INSERT INTO dashboard.plans (name, code, monthly_price, transaction_fee_percent, features, display_order)
VALUES (
  'Enterprise',
  'enterprise',
  0.00, -- Custom pricing
  0.00, -- Custom pricing
  '["bolt_core", "boltflow_complete", "boltguard", "boltmetrics", "boltx", "priority_support"]'::jsonb,
  3
) ON CONFLICT (code) DO NOTHING;

