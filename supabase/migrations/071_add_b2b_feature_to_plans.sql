-- ============================================================================
-- ADD B2B FEATURE TO PROFESSIONAL AND ENTERPRISE PLANS
-- ============================================================================
-- This migration adds the 'b2b' feature to Professional and Enterprise plans
-- B2B features include: approval workflows, credit limits, multi-buyers, and purchase orders

-- Update Professional plan to include B2B feature
UPDATE dashboard.plans
SET 
  features = '["bolt_core", "boltflow_complete", "boltguard", "boltmetrics", "b2b"]'::jsonb,
  updated_at = NOW()
WHERE code = 'professional';

-- Update Enterprise plan to include B2B feature
UPDATE dashboard.plans
SET 
  features = '["bolt_core", "boltflow_complete", "boltguard", "boltmetrics", "b2b", "boltx", "priority_support"]'::jsonb,
  updated_at = NOW()
WHERE code = 'enterprise';

-- Verify updates
DO $$
DECLARE
  professional_features JSONB;
  enterprise_features JSONB;
BEGIN
  -- Check Professional plan
  SELECT features INTO professional_features
  FROM dashboard.plans
  WHERE code = 'professional';
  
  IF professional_features IS NULL THEN
    RAISE EXCEPTION 'Professional plan not found';
  END IF;
  
  IF NOT (professional_features ? 'b2b') THEN
    RAISE EXCEPTION 'B2B feature not added to Professional plan';
  END IF;
  
  -- Check Enterprise plan
  SELECT features INTO enterprise_features
  FROM dashboard.plans
  WHERE code = 'enterprise';
  
  IF enterprise_features IS NULL THEN
    RAISE EXCEPTION 'Enterprise plan not found';
  END IF;
  
  IF NOT (enterprise_features ? 'b2b') THEN
    RAISE EXCEPTION 'B2B feature not added to Enterprise plan';
  END IF;
  
  RAISE NOTICE 'B2B feature successfully added to Professional and Enterprise plans';
END $$;

