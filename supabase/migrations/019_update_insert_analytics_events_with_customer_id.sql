-- ============================================================================
-- UPDATE INSERT ANALYTICS EVENTS FUNCTION TO SET CUSTOMER_ID
-- ============================================================================
-- This migration updates the insert_analytics_events function to properly set
-- customer_id from the event payload metadata or lookup from VTEX account name

-- Updated insert function that extracts customer_id from event metadata
CREATE OR REPLACE FUNCTION public.insert_analytics_events(
  p_events JSONB
)
RETURNS TABLE (
  id UUID
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO analytics.events (
    session_id,
    order_form_id,
    customer_id,
    event_type,
    category,
    step,
    metadata,
    timestamp
  )
  SELECT
    (event->>'session_id')::TEXT,
    NULLIF(event->>'order_form_id', 'null')::TEXT,
    -- Extract customer_id from event metadata if provided
    -- First try direct customer_id field
    COALESCE(
      -- Try customer_id from metadata
      NULLIF((event->'metadata'->>'customer_id')::TEXT, '')::UUID,
      -- Try customer_id from top level of event
      NULLIF((event->>'customer_id')::TEXT, '')::UUID,
      -- Try lookup by vtex_account_name from metadata
      (
        SELECT ca.id
        FROM customer.accounts ca
        WHERE ca.vtex_account_name = (event->'metadata'->>'vtex_account_name')
        LIMIT 1
      ),
      -- Try lookup by normalized vtex_account_name
      (
        SELECT ca.id
        FROM customer.accounts ca
        WHERE customer.normalize_vtex_account(ca.vtex_account_name) = 
              customer.normalize_vtex_account((event->'metadata'->>'vtex_account_name'))
        LIMIT 1
      ),
      -- Fallback to NULL if not found
      NULL
    ),
    (event->>'event_type')::TEXT,
    (event->>'category')::TEXT,
    NULLIF(event->>'step', 'null')::TEXT,
    COALESCE((event->>'metadata')::JSONB, '{}'::JSONB),
    COALESCE((event->>'timestamp')::TIMESTAMPTZ, NOW())
  FROM jsonb_array_elements(p_events) AS event
  RETURNING analytics.events.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

