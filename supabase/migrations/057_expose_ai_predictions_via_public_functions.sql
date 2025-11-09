-- ============================================================================
-- Expose AI Predictions via Public Functions
-- ============================================================================
-- Creates RPC functions in public schema to access analytics.ai_predictions
-- since PostgREST only exposes public schema by default

-- Function to get AI predictions by customer_id
CREATE OR REPLACE FUNCTION public.get_ai_predictions(
  p_customer_id UUID,
  p_prediction_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  session_id TEXT,
  order_form_id TEXT,
  prediction_type TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  confidence DECIMAL,
  factors JSONB,
  recommendations JSONB,
  intervention_suggested BOOLEAN,
  intervention_type TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.customer_id,
    p.session_id,
    p.order_form_id,
    p.prediction_type,
    p.risk_score,
    p.risk_level,
    p.confidence,
    p.factors,
    p.recommendations,
    p.intervention_suggested,
    p.intervention_type,
    p.created_at
  FROM analytics.ai_predictions p
  WHERE p.customer_id = p_customer_id
    AND (p_prediction_type IS NULL OR p.prediction_type = p_prediction_type)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION public.get_ai_predictions IS 'Get AI predictions for a customer account from analytics schema';

