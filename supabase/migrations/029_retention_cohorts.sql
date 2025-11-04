-- ============================================================================
-- RETENTION COHORT ANALYSIS MATERIALIZED VIEWS
-- ============================================================================
-- Materialized views for customer retention and cohort analysis

-- Customer cohorts (grouped by first purchase month)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.customer_cohorts AS
SELECT
  customer_id,
  COALESCE(order_form_id, session_id) AS customer_key,
  DATE_TRUNC('month', 
    MIN(CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN timestamp END)
  ) AS cohort_month,
  COUNT(DISTINCT CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN session_id END) AS total_orders,
  MIN(CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN timestamp END) AS first_order_date,
  MAX(CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN timestamp END) AS last_order_date
FROM analytics.events
WHERE customer_id IS NOT NULL
  AND event_type IN ('checkout_complete', 'order_confirmed')
GROUP BY customer_id, COALESCE(order_form_id, session_id);

-- Create unique index for refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_cohorts_unique
ON analytics.customer_cohorts (customer_id, customer_key);

-- Cohort retention metrics (pre-calculated retention rates)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.cohort_retention_metrics AS
SELECT
  cohort_month,
  COUNT(*) AS cohort_size,
  COUNT(CASE WHEN last_order_date >= first_order_date + INTERVAL '30 days' THEN 1 END) AS retained_d30,
  COUNT(CASE WHEN last_order_date >= first_order_date + INTERVAL '60 days' THEN 1 END) AS retained_d60,
  COUNT(CASE WHEN last_order_date >= first_order_date + INTERVAL '90 days' THEN 1 END) AS retained_d90,
  COUNT(CASE WHEN total_orders > 1 THEN 1 END) AS returning_customers,
  COUNT(CASE WHEN last_order_date < NOW() - INTERVAL '60 days' AND total_orders > 0 THEN 1 END) AS churned_customers
FROM analytics.customer_cohorts
GROUP BY cohort_month;

-- Create unique index for refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_cohort_retention_metrics_unique
ON analytics.cohort_retention_metrics (cohort_month);

-- Refresh function for retention views
CREATE OR REPLACE FUNCTION analytics.refresh_retention_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.customer_cohorts;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.cohort_retention_metrics;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON analytics.customer_cohorts TO authenticated;
GRANT SELECT ON analytics.cohort_retention_metrics TO authenticated;

