-- ============================================================================
-- PAYMENT GATEWAY FIELDS MIGRATION
-- ============================================================================
-- This migration adds payment gateway integration fields to support
-- multiple payment providers (Stripe, Paddle, etc.)

-- ============================================================================
-- UPDATE SUBSCRIPTION TRANSACTIONS TABLE
-- ============================================================================
-- Add fields to track payment gateway information

ALTER TABLE dashboard.subscription_transactions
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Add indexes for payment gateway lookups
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_payment_provider 
  ON dashboard.subscription_transactions (payment_provider);

CREATE INDEX IF NOT EXISTS idx_subscription_transactions_payment_intent 
  ON dashboard.subscription_transactions (payment_intent_id) 
  WHERE payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscription_transactions_gateway_subscription 
  ON dashboard.subscription_transactions (gateway_subscription_id) 
  WHERE gateway_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscription_transactions_gateway_customer 
  ON dashboard.subscription_transactions (gateway_customer_id) 
  WHERE gateway_customer_id IS NOT NULL;

-- Add constraint for payment provider format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_payment_provider_format' 
    AND conrelid = 'dashboard.subscription_transactions'::regclass
  ) THEN
    ALTER TABLE dashboard.subscription_transactions
      ADD CONSTRAINT check_payment_provider_format 
      CHECK (payment_provider ~* '^[a-z0-9_-]+$');
  END IF;
END $$;

-- ============================================================================
-- UPDATE SUBSCRIPTIONS TABLE
-- ============================================================================
-- Add fields to track payment gateway subscription information

ALTER TABLE dashboard.subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS gateway_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_customer_id TEXT;

-- Add indexes for payment gateway lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_provider 
  ON dashboard.subscriptions (payment_provider);

CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_subscription 
  ON dashboard.subscriptions (gateway_subscription_id) 
  WHERE gateway_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_customer 
  ON dashboard.subscriptions (gateway_customer_id) 
  WHERE gateway_customer_id IS NOT NULL;

-- Add constraint for payment provider format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_subscription_payment_provider_format' 
    AND conrelid = 'dashboard.subscriptions'::regclass
  ) THEN
    ALTER TABLE dashboard.subscriptions
      ADD CONSTRAINT check_subscription_payment_provider_format 
      CHECK (payment_provider ~* '^[a-z0-9_-]+$');
  END IF;
END $$;

-- ============================================================================
-- UPDATE ACCOUNTS TABLE
-- ============================================================================
-- Add field to store payment gateway customer ID

ALTER TABLE customer.accounts
  ADD COLUMN IF NOT EXISTS payment_gateway_customer_id TEXT;

-- Add index for payment gateway customer lookup
CREATE INDEX IF NOT EXISTS idx_accounts_payment_gateway_customer 
  ON customer.accounts (payment_gateway_customer_id) 
  WHERE payment_gateway_customer_id IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN dashboard.subscription_transactions.payment_provider IS 
  'Payment gateway provider (e.g., stripe, paddle)';

COMMENT ON COLUMN dashboard.subscription_transactions.payment_intent_id IS 
  'Payment intent ID from payment gateway (e.g., Stripe payment intent ID)';

COMMENT ON COLUMN dashboard.subscription_transactions.payment_method_id IS 
  'Payment method ID from payment gateway (e.g., Stripe payment method ID)';

COMMENT ON COLUMN dashboard.subscription_transactions.gateway_subscription_id IS 
  'Subscription ID from payment gateway (e.g., Stripe subscription ID)';

COMMENT ON COLUMN dashboard.subscription_transactions.gateway_customer_id IS 
  'Customer ID from payment gateway (e.g., Stripe customer ID)';

COMMENT ON COLUMN dashboard.subscription_transactions.gateway_invoice_id IS 
  'Invoice ID from payment gateway (e.g., Stripe invoice ID)';

COMMENT ON COLUMN dashboard.subscription_transactions.receipt_url IS 
  'URL to payment receipt from payment gateway';

COMMENT ON COLUMN dashboard.subscription_transactions.invoice_url IS 
  'URL to invoice from payment gateway';

COMMENT ON COLUMN dashboard.subscriptions.payment_provider IS 
  'Payment gateway provider (e.g., stripe, paddle)';

COMMENT ON COLUMN dashboard.subscriptions.gateway_subscription_id IS 
  'Subscription ID from payment gateway (e.g., Stripe subscription ID)';

COMMENT ON COLUMN dashboard.subscriptions.gateway_customer_id IS 
  'Customer ID from payment gateway (e.g., Stripe customer ID)';

COMMENT ON COLUMN customer.accounts.payment_gateway_customer_id IS 
  'Customer ID from payment gateway (e.g., Stripe customer ID)';

