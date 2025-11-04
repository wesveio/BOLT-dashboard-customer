-- ============================================================================
-- CUSTOMER LTV MATERIALIZED VIEWS
-- ============================================================================
-- Materialized views for Customer Lifetime Value calculations
-- These views aggregate customer data to improve query performance

-- Customer LTV summary (daily aggregation)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.customer_ltv_daily AS
SELECT
  customer_id,
  COALESCE(order_form_id, session_id) AS customer_key,
  DATE(timestamp) AS date,
  COUNT(DISTINCT CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN session_id END) AS orders,
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
  ) AS revenue,
  MIN(CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN timestamp END) AS first_order_date,
  MAX(CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN timestamp END) AS last_order_date
FROM analytics.events
WHERE customer_id IS NOT NULL
  AND event_type IN ('checkout_complete', 'order_confirmed')
GROUP BY customer_id, COALESCE(order_form_id, session_id), DATE(timestamp);

-- Create unique index for refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_ltv_daily_unique
ON analytics.customer_ltv_daily (customer_id, customer_key, date);

-- Customer LTV aggregated (all-time per customer)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.customer_ltv_summary AS
SELECT
  customer_id,
  COALESCE(order_form_id, session_id) AS customer_key,
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
  MAX(CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN timestamp END) AS last_order_date,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN event_type IN ('checkout_complete', 'order_confirmed') THEN session_id END) > 1 
    THEN true 
    ELSE false 
  END AS is_recurring
FROM analytics.events
WHERE customer_id IS NOT NULL
  AND event_type IN ('checkout_complete', 'order_confirmed')
GROUP BY customer_id, COALESCE(order_form_id, session_id);

-- Create unique index for refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_ltv_summary_unique
ON analytics.customer_ltv_summary (customer_id, customer_key);

-- Refresh function for LTV views
CREATE OR REPLACE FUNCTION analytics.refresh_ltv_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.customer_ltv_daily;
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.customer_ltv_summary;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON analytics.customer_ltv_daily TO authenticated;
GRANT SELECT ON analytics.customer_ltv_summary TO authenticated;

