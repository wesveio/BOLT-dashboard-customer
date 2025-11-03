-- ============================================================================
-- Migration: Fix ambiguous column reference in upsert_metrics_api_key UPDATE
-- ============================================================================
-- This migration fixes the ambiguous column reference error in the UPDATE
-- statement of upsert_metrics_api_key function.
-- 
-- Issue: UPDATE RETURNING clause cannot use fully qualified table names like
-- INSERT does. Instead, we must use a table alias in the UPDATE statement
-- and reference that alias in the RETURNING clause.
-- ============================================================================

-- Fix upsert_metrics_api_key function - UPDATE statement only
CREATE OR REPLACE FUNCTION public.upsert_metrics_api_key(
  p_account_id UUID,
  p_key_hash TEXT,
  p_key_prefix TEXT,
  p_key_suffix TEXT,
  p_created_by UUID
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  key_type TEXT,
  key_prefix TEXT,
  key_suffix TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_key_id UUID;
BEGIN
  -- Try to update existing metrics key
  -- Use table alias in UPDATE and RETURNING to avoid ambiguity with later SELECT
  UPDATE dashboard.api_keys AS k
  SET 
    key_hash = p_key_hash,
    key_prefix = p_key_prefix,
    key_suffix = p_key_suffix,
    updated_at = NOW()
  WHERE k.account_id = p_account_id
    AND k.key_type = 'metrics'
  RETURNING k.id INTO v_key_id;
  
  -- If no existing key, create new one
  -- Use fully qualified table name in RETURNING (works for INSERT)
  IF v_key_id IS NULL THEN
    INSERT INTO dashboard.api_keys (
      account_id,
      key_type,
      key_hash,
      key_prefix,
      key_suffix,
      created_by
    )
    VALUES (
      p_account_id,
      'metrics',
      p_key_hash,
      p_key_prefix,
      p_key_suffix,
      p_created_by
    )
    RETURNING dashboard.api_keys.id INTO v_key_id;
  END IF;
  
  RETURN QUERY
  SELECT 
    k.id,
    k.account_id,
    k.key_type,
    k.key_prefix,
    k.key_suffix,
    k.created_at,
    k.updated_at
  FROM dashboard.api_keys k
  WHERE k.id = v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

