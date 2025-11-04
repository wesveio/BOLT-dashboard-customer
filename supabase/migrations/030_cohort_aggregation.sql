-- ============================================================================
-- COHORT AGGREGATION MATERIALIZED VIEWS
-- ============================================================================
-- Enhanced cohort analysis views for better performance

-- Cohort retention matrix (pre-calculated retention by period)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.cohort_retention_matrix AS
WITH customer_cohorts AS (
  SELECT
    customer_id,
    COALESCE(order_form_id, session_id) AS customer_key,
    DATE_TRUNC('month', 
      MIN(CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN timestamp END)
    ) AS cohort_month,
    COUNT(DISTINCT CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN session_id END) AS total_orders,
    SUM(
      CASE 
        WHEN event_type IN ('checkout_complete', 'order_confirmed') 
        THEN COALESCE(
          (metadata->>'revenue')::numeric,
          (metadata->>'value')::numeric,
          (metadata->>'orderValue')::numeric,
          (metadata->>'totalValue')::numeric,
          (metadata->>'amount')::numeric,
          0
        )
        ELSE 0
      END
    ) AS total_revenue,
    MIN(CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN timestamp END) AS first_order_date,
    MAX(CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN timestamp END) AS last_order_date
  FROM analytics.events
  WHERE customer_id IS NOT NULL
    AND event_type IN ('checkout_complete', 'order_confirmed')
  GROUP BY customer_id, COALESCE(order_form_id, session_id)
)
SELECT
  cohort_month,
  COUNT(*) AS cohort_size,
  SUM(total_revenue) AS cohort_revenue,
  AVG(total_revenue) AS avg_ltv,
  COUNT(CASE WHEN total_orders > 1 THEN 1 END) AS returning_customers,
  -- Retention by period (months since first purchase)
  COUNT(CASE WHEN last_order_date >= first_order_date + INTERVAL '1 month' THEN 1 END) AS retained_m1,
  COUNT(CASE WHEN last_order_date >= first_order_date + INTERVAL '2 months' THEN 1 END) AS retained_m2,
  COUNT(CASE WHEN last_order_date >= first_order_date + INTERVAL '3 months' THEN 1 END) AS retained_m3,
  COUNT(CASE WHEN last_order_date >= first_order_date + INTERVAL '6 months' THEN 1 END) AS retained_m6,
  COUNT(CASE WHEN last_order_date >= first_order_date + INTERVAL '12 months' THEN 1 END) AS retained_m12
FROM customer_cohorts
GROUP BY cohort_month;

-- Create unique index for refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_cohort_retention_matrix_unique
ON analytics.cohort_retention_matrix (cohort_month);

-- Refresh function for cohort views
CREATE OR REPLACE FUNCTION analytics.refresh_cohort_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.cohort_retention_matrix;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON analytics.cohort_retention_matrix TO authenticated;

