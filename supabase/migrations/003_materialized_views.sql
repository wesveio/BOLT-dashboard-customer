-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- Hourly checkout metrics
CREATE MATERIALIZED VIEW analytics.checkout_metrics_hourly AS
SELECT
  customer_id,
  time_bucket('1 hour', timestamp) AS hour,
  COUNT(DISTINCT session_id) AS total_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'order_confirmed' THEN session_id END) AS completed_checkouts,
  COUNT(DISTINCT CASE WHEN event_type = 'step_abandoned' THEN session_id END) AS abandoned_checkouts,
  AVG((metadata->>'duration')::numeric) AS avg_duration,
  SUM((metadata->>'cartValue')::numeric) AS total_revenue,
  AVG((metadata->>'cartValue')::numeric) AS avg_cart_value,
  COUNT(DISTINCT CASE WHEN category = 'error' THEN session_id END) AS error_sessions
FROM analytics.events
WHERE category IN ('metric', 'user_action')
GROUP BY customer_id, time_bucket('1 hour', timestamp);

-- Create unique index for refresh
CREATE UNIQUE INDEX idx_checkout_metrics_hourly_unique
ON analytics.checkout_metrics_hourly (customer_id, hour);

-- Daily checkout metrics
CREATE MATERIALIZED VIEW analytics.checkout_metrics_daily AS
SELECT
  customer_id,
  DATE(timestamp) AS date,
  COUNT(DISTINCT session_id) AS total_sessions,
  COUNT(DISTINCT CASE WHEN event_type = 'order_confirmed' THEN session_id END) AS completed_checkouts,
  COUNT(DISTINCT CASE WHEN event_type = 'step_abandoned' THEN session_id END) AS abandoned_checkouts,
  AVG((metadata->>'duration')::numeric) AS avg_duration,
  SUM((metadata->>'cartValue')::numeric) AS total_revenue,
  AVG((metadata->>'cartValue')::numeric) AS avg_cart_value,
  COUNT(DISTINCT order_form_id) AS unique_orders
FROM analytics.events
WHERE category IN ('metric', 'user_action')
GROUP BY customer_id, DATE(timestamp);

-- Create unique index for refresh
CREATE UNIQUE INDEX idx_checkout_metrics_daily_unique
ON analytics.checkout_metrics_daily (customer_id, date);

-- Funnel metrics by step
CREATE MATERIALIZED VIEW analytics.checkout_funnel AS
SELECT
  customer_id,
  DATE(timestamp) AS date,
  COUNT(DISTINCT CASE WHEN event_type = 'checkout_started' THEN session_id END) AS started,
  COUNT(DISTINCT CASE WHEN event_type = 'step_completed' AND step = 'cart' THEN session_id END) AS cart_completed,
  COUNT(DISTINCT CASE WHEN event_type = 'step_completed' AND step = 'profile' THEN session_id END) AS profile_completed,
  COUNT(DISTINCT CASE WHEN event_type = 'step_completed' AND step = 'shipping' THEN session_id END) AS shipping_completed,
  COUNT(DISTINCT CASE WHEN event_type = 'step_completed' AND step = 'payment' THEN session_id END) AS payment_completed,
  COUNT(DISTINCT CASE WHEN event_type = 'order_confirmed' THEN session_id END) AS confirmed
FROM analytics.events
WHERE category = 'user_action'
GROUP BY customer_id, DATE(timestamp);

-- Create unique index for refresh
CREATE UNIQUE INDEX idx_checkout_funnel_unique
ON analytics.checkout_funnel (customer_id, date);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION analytics.refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.checkout_metrics_hourly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.checkout_metrics_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.checkout_funnel;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-analytics', '0 * * * *', 'SELECT analytics.refresh_materialized_views()');

