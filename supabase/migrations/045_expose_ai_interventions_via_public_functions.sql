-- ============================================================================
-- AI INTERVENTIONS FUNCTIONS
-- ============================================================================
-- These functions expose analytics.ai_interventions table through public schema
-- since PostgREST only exposes public schema by default

-- Get AI interventions by customer_id and date range
CREATE OR REPLACE FUNCTION public.get_ai_interventions(
  p_customer_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_intervention_type TEXT DEFAULT NULL,
  p_applied BOOLEAN DEFAULT NULL,
  p_result TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  order_form_id TEXT,
  intervention_type TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  applied BOOLEAN,
  applied_at TIMESTAMPTZ,
  result TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.session_id,
    i.order_form_id,
    i.intervention_type,
    i.risk_score,
    i.risk_level,
    i.applied,
    i.applied_at,
    i.result,
    i.metadata,
    i.created_at
  FROM analytics.ai_interventions i
  WHERE i.customer_id = p_customer_id
    AND (p_start_date IS NULL OR i.created_at >= p_start_date)
    AND (p_end_date IS NULL OR i.created_at <= p_end_date)
    AND (p_intervention_type IS NULL OR i.intervention_type = p_intervention_type)
    AND (p_applied IS NULL OR i.applied = p_applied)
    AND (p_result IS NULL OR i.result = p_result)
  ORDER BY i.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_ai_interventions TO service_role, postgres, authenticated;

