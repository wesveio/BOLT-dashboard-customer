-- ============================================================================
-- Migration: Fix pg_trgm security warning by moving to extensions schema
-- ============================================================================
-- Problem: Extension pg_trgm is installed in public schema (security warning)
-- Solution: Create dedicated extensions schema and move pg_trgm there
-- Reference: https://supabase.com/docs/guides/database/extensions
-- ============================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to all necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move pg_trgm extension from public to extensions schema
-- This handles both cases:
-- 1. Extension exists in public schema (move it)
-- 2. Extension doesn't exist yet (create it in extensions schema)
DO $$
BEGIN
  -- Check if extension exists in public schema
  IF EXISTS (
    SELECT 1 
    FROM pg_extension 
    WHERE extname = 'pg_trgm' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Move existing extension from public to extensions schema
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    RAISE NOTICE 'Moved pg_trgm extension from public to extensions schema';
  ELSIF NOT EXISTS (
    SELECT 1 
    FROM pg_extension 
    WHERE extname = 'pg_trgm'
  ) THEN
    -- Create extension in extensions schema if it doesn't exist
    CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;
    RAISE NOTICE 'Created pg_trgm extension in extensions schema';
  ELSE
    -- Extension already exists in extensions schema (or another schema)
    RAISE NOTICE 'pg_trgm extension already exists in correct location';
  END IF;
END $$;

-- Verify the extension is in the correct schema
DO $$
DECLARE
  v_schema_name TEXT;
BEGIN
  SELECT nspname INTO v_schema_name
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE e.extname = 'pg_trgm';
  
  IF v_schema_name = 'extensions' THEN
    RAISE NOTICE '✅ pg_trgm extension is correctly located in extensions schema';
  ELSE
    RAISE WARNING '⚠️ pg_trgm extension is in schema: %. Expected: extensions', v_schema_name;
  END IF;
END $$;

