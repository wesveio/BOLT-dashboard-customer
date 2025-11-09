-- ============================================================================
-- Fix ambiguous column reference in insert_ai_insights function
-- ============================================================================
-- This migration fixes the ambiguous column reference error (code: '42702')
-- in the insert_ai_insights function.
-- 
-- Issue: Column reference "id" is ambiguous because:
--   - RETURNS TABLE defines a column named "id"
--   - RETURNING clause also returns "id"
--   - PostgreSQL cannot determine which "id" to use
-- 
-- Solution: Use alias in RETURNING clause and reference it explicitly
-- ============================================================================

-- Fix insert_ai_insights function - resolve ambiguous column reference
CREATE OR REPLACE FUNCTION public.insert_ai_insights(
  p_insights JSONB
)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  category TEXT,
  title TEXT,
  description TEXT,
  impact TEXT,
  recommendations JSONB,
  metadata JSONB,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  inserted_ids UUID[];
BEGIN
  -- Insert all insights and collect their IDs
  -- Use fully qualified table name in RETURNING to avoid ambiguity with RETURNS TABLE column
  WITH inserted_rows AS (
    INSERT INTO analytics.ai_insights (
      customer_id,
      category,
      title,
      description,
      impact,
      recommendations,
      metadata,
      generated_at
    )
    SELECT 
      (insight->>'customer_id')::UUID,
      insight->>'category',
      insight->>'title',
      insight->>'description',
      insight->>'impact',
      COALESCE((insight->>'recommendations')::JSONB, '[]'::JSONB),
      COALESCE((insight->>'metadata')::JSONB, '{}'::JSONB),
      COALESCE((insight->>'generated_at')::TIMESTAMPTZ, NOW())
    FROM jsonb_array_elements(p_insights) AS insight
    RETURNING analytics.ai_insights.id AS inserted_id
  )
  SELECT array_agg(inserted_rows.inserted_id) INTO inserted_ids FROM inserted_rows;

  -- Return all inserted insights
  RETURN QUERY
  SELECT 
    i.id,
    i.customer_id,
    i.category,
    i.title,
    i.description,
    i.impact,
    i.recommendations,
    i.metadata,
    i.generated_at,
    i.created_at
  FROM analytics.ai_insights i
  WHERE i.id = ANY(inserted_ids)
  ORDER BY i.generated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

