-- ============================================================================
-- INSERT ANALYTICS EVENTS FUNCTION
-- ============================================================================
-- Function to insert analytics events via RPC (required for metrics API)
-- Since PostgREST only exposes public schema by default, we need this
-- function to insert into analytics.events table

-- Insert analytics events (for metrics API)
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
    NULL,
    (event->>'event_type')::TEXT,
    (event->>'category')::TEXT,
    NULLIF(event->>'step', 'null')::TEXT,
    COALESCE((event->>'metadata')::JSONB, '{}'::JSONB),
    COALESCE((event->>'timestamp')::TIMESTAMPTZ, NOW())
  FROM jsonb_array_elements(p_events) AS event
  RETURNING analytics.events.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

