-- ============================================================================
-- AI OPTIMIZATIONS FUNCTIONS
-- ============================================================================
-- These functions expose analytics.ai_optimizations table through public schema
-- since PostgREST only exposes public schema by default

-- Get AI optimizations by customer_id
CREATE OR REPLACE FUNCTION public.get_ai_optimizations(
  p_customer_id UUID,
  p_status TEXT DEFAULT NULL,
  p_optimization_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  optimization_type TEXT,
  name TEXT,
  description TEXT,
  config JSONB,
  status TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.customer_id,
    o.optimization_type,
    o.name,
    o.description,
    o.config,
    o.status,
    o.metrics,
    o.created_at,
    o.updated_at,
    o.started_at,
    o.completed_at
  FROM analytics.ai_optimizations o
  WHERE o.customer_id = p_customer_id
    AND (p_status IS NULL OR o.status = p_status)
    AND (p_optimization_type IS NULL OR o.optimization_type = p_optimization_type)
  ORDER BY o.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert AI optimization
CREATE OR REPLACE FUNCTION public.insert_ai_optimization(
  p_customer_id UUID,
  p_optimization_type TEXT,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_config JSONB DEFAULT '{}'::jsonb,
  p_status TEXT DEFAULT 'active',
  p_started_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  optimization_type TEXT,
  name TEXT,
  description TEXT,
  config JSONB,
  status TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO analytics.ai_optimizations (
    customer_id,
    optimization_type,
    name,
    description,
    config,
    status,
    started_at
  )
  VALUES (
    p_customer_id,
    p_optimization_type,
    p_name,
    p_description,
    p_config,
    p_status,
    COALESCE(p_started_at, NOW())
  )
  RETURNING id INTO v_id;

  RETURN QUERY
  SELECT 
    o.id,
    o.customer_id,
    o.optimization_type,
    o.name,
    o.description,
    o.config,
    o.status,
    o.metrics,
    o.created_at,
    o.updated_at,
    o.started_at,
    o.completed_at
  FROM analytics.ai_optimizations o
  WHERE o.id = v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update AI optimization
CREATE OR REPLACE FUNCTION public.update_ai_optimization(
  p_id UUID,
  p_customer_id UUID,
  p_status TEXT DEFAULT NULL,
  p_metrics JSONB DEFAULT NULL,
  p_completed_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  optimization_type TEXT,
  name TEXT,
  description TEXT,
  config JSONB,
  status TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  UPDATE analytics.ai_optimizations
  SET 
    updated_at = NOW(),
    status = COALESCE(p_status, status),
    metrics = COALESCE(p_metrics, metrics),
    completed_at = CASE 
      WHEN p_status = 'completed' AND completed_at IS NULL THEN COALESCE(p_completed_at, NOW())
      WHEN p_status = 'completed' THEN completed_at
      ELSE p_completed_at
    END
  WHERE id = p_id
    AND customer_id = p_customer_id;

  RETURN QUERY
  SELECT 
    o.id,
    o.customer_id,
    o.optimization_type,
    o.name,
    o.description,
    o.config,
    o.status,
    o.metrics,
    o.created_at,
    o.updated_at,
    o.started_at,
    o.completed_at
  FROM analytics.ai_optimizations o
  WHERE o.id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_ai_optimizations TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.insert_ai_optimization TO service_role, postgres, authenticated;
GRANT EXECUTE ON FUNCTION public.update_ai_optimization TO service_role, postgres, authenticated;

