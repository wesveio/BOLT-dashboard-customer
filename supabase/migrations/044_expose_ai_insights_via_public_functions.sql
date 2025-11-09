-- ============================================================================
-- AI INSIGHTS FUNCTIONS
-- ============================================================================
-- These functions expose analytics.ai_insights table through public schema
-- since PostgREST only exposes public schema by default

-- Insert AI insights (accepts array of insights)
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
  WITH inserted AS (
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
    RETURNING id
  )
  SELECT array_agg(id) INTO inserted_ids FROM inserted;

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

-- Get AI insights by customer_id
CREATE OR REPLACE FUNCTION public.get_ai_insights(
  p_customer_id UUID,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
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
BEGIN
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
  WHERE i.customer_id = p_customer_id
    AND (p_category IS NULL OR i.category = p_category)
  ORDER BY i.generated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

