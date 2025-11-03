-- ============================================================================
-- UPDATE ANALYTICS EVENTS FUNCTIONS TO SORT DESC
-- ============================================================================
-- Update RPC functions to sort events by timestamp DESC (newest first)
-- This is more efficient than sorting in JavaScript and matches UI expectations

-- Update get_analytics_events to sort DESC
CREATE OR REPLACE FUNCTION public.get_analytics_events(
  p_customer_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_event_types TEXT[] DEFAULT NULL,
  p_categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  order_form_id TEXT,
  customer_id UUID,
  event_type TEXT,
  category TEXT,
  step TEXT,
  metadata JSONB,
  "timestamp" TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.session_id,
    e.order_form_id,
    e.customer_id,
    e.event_type,
    e.category,
    e.step,
    e.metadata,
    e.timestamp,
    e.timestamp as created_at
  FROM analytics.events e
  WHERE e.customer_id = p_customer_id
    AND (p_start_date IS NULL OR e.timestamp >= p_start_date)
    AND (p_end_date IS NULL OR e.timestamp <= p_end_date)
    AND (p_event_types IS NULL OR e.event_type = ANY(p_event_types))
    AND (p_categories IS NULL OR e.category = ANY(p_categories))
  ORDER BY e.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_analytics_events_by_types to sort DESC
CREATE OR REPLACE FUNCTION public.get_analytics_events_by_types(
  p_customer_id UUID,
  p_event_types TEXT[],
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  order_form_id TEXT,
  customer_id UUID,
  event_type TEXT,
  category TEXT,
  step TEXT,
  metadata JSONB,
  "timestamp" TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.session_id,
    e.order_form_id,
    e.customer_id,
    e.event_type,
    e.category,
    e.step,
    e.metadata,
    e.timestamp,
    e.timestamp as created_at
  FROM analytics.events e
  WHERE e.customer_id = p_customer_id
    AND e.event_type = ANY(p_event_types)
    AND (p_start_date IS NULL OR e.timestamp >= p_start_date)
    AND (p_end_date IS NULL OR e.timestamp <= p_end_date)
  ORDER BY e.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

