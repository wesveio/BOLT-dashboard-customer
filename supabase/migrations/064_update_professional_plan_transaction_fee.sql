-- ============================================================================
-- Migration: Update Professional plan transaction fee
-- ============================================================================
-- Updates the transaction_fee_percent for the Professional plan from 0.50% to 0.80%
-- ============================================================================

UPDATE dashboard.plans
SET 
  transaction_fee_percent = 0.80,
  updated_at = NOW()
WHERE code = 'professional' AND transaction_fee_percent = 0.50;

