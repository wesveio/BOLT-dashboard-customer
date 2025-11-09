-- ============================================================================
-- Add 'abandonment' category to ai_insights constraint
-- ============================================================================
-- This migration updates the ai_insights_category_check constraint to include
-- 'abandonment' as a valid category, since AI-generated insights may use this
-- category when analyzing checkout abandonment data.
-- 
-- Note: The application code also normalizes 'abandonment' to 'conversion' as
-- a fallback, but adding it to the constraint provides more flexibility.
-- ============================================================================

-- Drop the old constraint
ALTER TABLE analytics.ai_insights 
  DROP CONSTRAINT IF EXISTS ai_insights_category_check;

-- Add new constraint with 'abandonment' category included
ALTER TABLE analytics.ai_insights 
  ADD CONSTRAINT ai_insights_category_check 
  CHECK (category IN ('revenue', 'conversion', 'ux', 'security', 'abandonment'));

