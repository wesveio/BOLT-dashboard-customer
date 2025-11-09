-- ============================================================================
-- Fix BoltX Configurations Functions
-- ============================================================================
-- This migration fixes the RPC functions to be in public schema
-- Migration 040 may have been applied with functions in analytics schema
-- This ensures they are in public schema for RPC access

-- Drop existing functions if they exist in wrong schema
DROP FUNCTION IF EXISTS analytics.get_boltx_configuration(UUID);
DROP FUNCTION IF EXISTS analytics.upsert_boltx_configuration(UUID, BOOLEAN, TEXT, TEXT, TEXT, INTEGER, DECIMAL, BOOLEAN, INTEGER, INTEGER, TEXT, JSONB);

-- Function to get BoltX configuration for a customer
-- Create in public schema for RPC access
CREATE OR REPLACE FUNCTION public.get_boltx_configuration(
  p_customer_id UUID
)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  enabled BOOLEAN,
  ai_provider TEXT,
  openai_api_key_encrypted TEXT,
  openai_model TEXT,
  openai_max_tokens INTEGER,
  openai_temperature DECIMAL,
  cache_enabled BOOLEAN,
  cache_ttl INTEGER,
  rate_limit INTEGER,
  prediction_model_version TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.customer_id,
    c.enabled,
    c.ai_provider,
    c.openai_api_key_encrypted,
    c.openai_model,
    c.openai_max_tokens,
    c.openai_temperature,
    c.cache_enabled,
    c.cache_ttl,
    c.rate_limit,
    c.prediction_model_version,
    c.metadata,
    c.created_at,
    c.updated_at
  FROM analytics.boltx_configurations c
  WHERE c.customer_id = p_customer_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert BoltX configuration
-- Create in public schema for RPC access
CREATE OR REPLACE FUNCTION public.upsert_boltx_configuration(
  p_customer_id UUID,
  p_enabled BOOLEAN DEFAULT NULL,
  p_ai_provider TEXT DEFAULT NULL,
  p_openai_api_key_encrypted TEXT DEFAULT NULL,
  p_openai_model TEXT DEFAULT NULL,
  p_openai_max_tokens INTEGER DEFAULT NULL,
  p_openai_temperature DECIMAL DEFAULT NULL,
  p_cache_enabled BOOLEAN DEFAULT NULL,
  p_cache_ttl INTEGER DEFAULT NULL,
  p_rate_limit INTEGER DEFAULT NULL,
  p_prediction_model_version TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_config_id UUID;
BEGIN
  INSERT INTO analytics.boltx_configurations (
    customer_id,
    enabled,
    ai_provider,
    openai_api_key_encrypted,
    openai_model,
    openai_max_tokens,
    openai_temperature,
    cache_enabled,
    cache_ttl,
    rate_limit,
    prediction_model_version,
    metadata,
    updated_at
  )
  VALUES (
    p_customer_id,
    COALESCE(p_enabled, false),
    COALESCE(p_ai_provider, 'openai'),
    p_openai_api_key_encrypted,
    COALESCE(p_openai_model, 'gpt-4-turbo-preview'),
    COALESCE(p_openai_max_tokens, 2000),
    COALESCE(p_openai_temperature, 0.7),
    COALESCE(p_cache_enabled, true),
    COALESCE(p_cache_ttl, 3600),
    COALESCE(p_rate_limit, 60),
    COALESCE(p_prediction_model_version, 'v1'),
    COALESCE(p_metadata, '{}'::jsonb),
    NOW()
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    enabled = COALESCE(p_enabled, boltx_configurations.enabled),
    ai_provider = COALESCE(p_ai_provider, boltx_configurations.ai_provider),
    openai_api_key_encrypted = COALESCE(p_openai_api_key_encrypted, boltx_configurations.openai_api_key_encrypted),
    openai_model = COALESCE(p_openai_model, boltx_configurations.openai_model),
    openai_max_tokens = COALESCE(p_openai_max_tokens, boltx_configurations.openai_max_tokens),
    openai_temperature = COALESCE(p_openai_temperature, boltx_configurations.openai_temperature),
    cache_enabled = COALESCE(p_cache_enabled, boltx_configurations.cache_enabled),
    cache_ttl = COALESCE(p_cache_ttl, boltx_configurations.cache_ttl),
    rate_limit = COALESCE(p_rate_limit, boltx_configurations.rate_limit),
    prediction_model_version = COALESCE(p_prediction_model_version, boltx_configurations.prediction_model_version),
    metadata = COALESCE(p_metadata, boltx_configurations.metadata),
    updated_at = NOW()
  RETURNING id INTO v_config_id;
  
  RETURN v_config_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comments
COMMENT ON FUNCTION public.get_boltx_configuration IS 'Retrieve BoltX configuration for a customer account';
COMMENT ON FUNCTION public.upsert_boltx_configuration IS 'Create or update BoltX configuration for a customer account';

