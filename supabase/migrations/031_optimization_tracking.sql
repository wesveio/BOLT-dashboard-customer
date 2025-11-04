-- ============================================================================
-- OPTIMIZATION TRACKING
-- ============================================================================
-- Track optimization events and A/B tests for ROI calculation

-- Optimization events table (optional - can use analytics.events with metadata)
CREATE TABLE IF NOT EXISTS analytics.optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  optimization_name TEXT NOT NULL,
  optimization_type TEXT NOT NULL, -- 'feature_flag', 'ab_test', 'ui_change', 'flow_change'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  description TEXT,
  cost NUMERIC(10, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_optimizations_customer_id ON analytics.optimizations(customer_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_dates ON analytics.optimizations(start_date, end_date);

-- Optimization metrics (pre-calculated metrics before/after)
CREATE TABLE IF NOT EXISTS analytics.optimization_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id UUID NOT NULL REFERENCES analytics.optimizations(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL, -- 'before', 'after'
  sessions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5, 2) DEFAULT 0,
  revenue NUMERIC(10, 2) DEFAULT 0,
  orders INTEGER DEFAULT 0,
  aov NUMERIC(10, 2) DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(optimization_id, period_type)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_optimization_metrics_optimization_id ON analytics.optimization_metrics(optimization_id);

-- Function to calculate optimization metrics
CREATE OR REPLACE FUNCTION analytics.calculate_optimization_metrics(
  p_optimization_id UUID,
  p_customer_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_period_type TEXT
)
RETURNS void AS $$
DECLARE
  v_sessions INTEGER;
  v_conversions INTEGER;
  v_revenue NUMERIC;
  v_orders INTEGER;
BEGIN
  -- Calculate sessions
  SELECT COUNT(DISTINCT session_id) INTO v_sessions
  FROM analytics.events
  WHERE customer_id = p_customer_id
    AND event_type = 'checkout_start'
    AND timestamp >= p_start_date
    AND timestamp < p_end_date;

  -- Calculate conversions
  SELECT COUNT(DISTINCT session_id) INTO v_conversions
  FROM analytics.events
  WHERE customer_id = p_customer_id
    AND event_type IN ('checkout_complete', 'order_confirmed')
    AND timestamp >= p_start_date
    AND timestamp < p_end_date;

  -- Calculate revenue and orders
  SELECT 
    COUNT(DISTINCT session_id),
    COALESCE(SUM(
      COALESCE(
        (metadata->>'revenue')::numeric,
        (metadata->>'value')::numeric,
        (metadata->>'orderValue')::numeric,
        (metadata->>'totalValue')::numeric,
        (metadata->>'amount')::numeric,
        0
      )
    ), 0)
  INTO v_orders, v_revenue
  FROM analytics.events
  WHERE customer_id = p_customer_id
    AND event_type IN ('checkout_complete', 'order_confirmed')
    AND timestamp >= p_start_date
    AND timestamp < p_end_date;

  -- Insert or update metrics
  INSERT INTO analytics.optimization_metrics (
    optimization_id,
    period_type,
    sessions,
    conversions,
    conversion_rate,
    revenue,
    orders,
    aov
  )
  VALUES (
    p_optimization_id,
    p_period_type,
    v_sessions,
    v_conversions,
    CASE WHEN v_sessions > 0 THEN (v_conversions::numeric / v_sessions::numeric) * 100 ELSE 0 END,
    v_revenue,
    v_orders,
    CASE WHEN v_orders > 0 THEN v_revenue / v_orders ELSE 0 END
  )
  ON CONFLICT (optimization_id, period_type) DO UPDATE SET
    sessions = EXCLUDED.sessions,
    conversions = EXCLUDED.conversions,
    conversion_rate = EXCLUDED.conversion_rate,
    revenue = EXCLUDED.revenue,
    orders = EXCLUDED.orders,
    aov = EXCLUDED.aov,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON analytics.optimizations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON analytics.optimization_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION analytics.calculate_optimization_metrics TO authenticated;

