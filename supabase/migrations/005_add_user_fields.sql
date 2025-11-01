-- ============================================================================
-- ADD USER PROFILE FIELDS AND SETTINGS
-- ============================================================================

-- Add profile fields to dashboard.users
ALTER TABLE dashboard.users
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Rename last_login_at to last_login for consistency (if it exists)
-- Otherwise, add last_login column if it doesn't exist
DO $$
BEGIN
  -- If last_login_at exists, rename it to last_login
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'dashboard' 
             AND table_name = 'users' 
             AND column_name = 'last_login_at') THEN
    ALTER TABLE dashboard.users RENAME COLUMN last_login_at TO last_login;
  -- If neither last_login_at nor last_login exist, add last_login
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'dashboard' 
                     AND table_name = 'users' 
                     AND column_name = 'last_login') THEN
    ALTER TABLE dashboard.users ADD COLUMN last_login TIMESTAMPTZ;
  END IF;
END $$;

-- Add account_id to analytics.events (alias for customer_id, but more semantic)
-- Note: customer_id already exists, but we'll create an index for account_id queries
CREATE INDEX IF NOT EXISTS idx_events_account_id ON analytics.events (customer_id, timestamp DESC);

-- ============================================================================
-- FUNCTIONS FOR DATA NORMALIZATION
-- ============================================================================

-- Function to normalize VTEX Account name (lowercase, trim, remove spaces)
CREATE OR REPLACE FUNCTION customer.normalize_vtex_account(account_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, trim whitespace, and remove all spaces
  RETURN lower(trim(regexp_replace(account_name, '\s+', '', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

