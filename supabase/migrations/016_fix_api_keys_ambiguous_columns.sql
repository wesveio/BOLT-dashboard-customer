-- ============================================================================
-- Migration: Fix ambiguous column references in API keys functions
-- ============================================================================
-- This migration fixes the ambiguous column reference errors in API keys
-- functions by using fully qualified table names in RETURNING clauses,
-- following the pattern established in migration 014.
-- 
-- Pattern: Use fully qualified table names in RETURNING when there's a
-- subsequent SELECT with alias that could cause ambiguity.
-- ============================================================================

-- Fix upsert_metrics_api_key function
-- Issue: RETURNING clause uses unqualified 'id' while later SELECT uses alias 'k'
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
  -- Use fully qualified table name in RETURNING to avoid ambiguity with later SELECT
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

-- Fix create_custom_api_key function
-- Issue: RETURNING clause uses unqualified 'id' while later SELECT uses alias 'k'
CREATE OR REPLACE FUNCTION public.create_custom_api_key(
  p_account_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_key_hash TEXT,
  p_key_prefix TEXT,
  p_key_suffix TEXT,
  p_created_by UUID
)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  key_type TEXT,
  name TEXT,
  description TEXT,
  key_prefix TEXT,
  key_suffix TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
DECLARE
  v_key_id UUID;
BEGIN
  INSERT INTO dashboard.api_keys (
    account_id,
    key_type,
    name,
    description,
    key_hash,
    key_prefix,
    key_suffix,
    created_by
  )
  VALUES (
    p_account_id,
    'custom',
    p_name,
    p_description,
    p_key_hash,
    p_key_prefix,
    p_key_suffix,
    p_created_by
  )
  RETURNING dashboard.api_keys.id INTO v_key_id;
  
  RETURN QUERY
  SELECT 
    k.id,
    k.account_id,
    k.key_type,
    k.name,
    k.description,
    k.key_prefix,
    k.key_suffix,
    k.created_at,
    k.updated_at,
    k.created_by
  FROM dashboard.api_keys k
  WHERE k.id = v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix delete_api_key function
-- Issue: No alias needed for DELETE, but added for consistency with other functions
-- Note: DELETE doesn't have RETURNING, so no ambiguity issue, but keeping pattern consistent
CREATE OR REPLACE FUNCTION public.delete_api_key(
  p_key_id UUID,
  p_account_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted BOOLEAN := false;
BEGIN
  DELETE FROM dashboard.api_keys
  WHERE id = p_key_id
    AND account_id = p_account_id
    AND key_type = 'custom';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

