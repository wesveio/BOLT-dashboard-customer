-- ============================================================================
-- Migration: Create extensions schema and move pg_trgm
-- ============================================================================
-- Problem: Extension pg_trgm is installed in public schema (security warning)
-- Solution: Create dedicated extensions schema and move pg_trgm there
-- ============================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move pg_trgm extension from public to extensions schema
-- Note: ALTER EXTENSION ... SET SCHEMA requires the extension to exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_extension 
    WHERE extname = 'pg_trgm' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END $$;

