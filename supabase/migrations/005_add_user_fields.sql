-- ============================================================================
-- ADD USER PROFILE FIELDS AND SETTINGS
-- ============================================================================

-- Add profile fields to dashboard.users
ALTER TABLE dashboard.users
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Add account_id to analytics.events (alias for customer_id, but more semantic)
-- Note: customer_id already exists, but we'll create an index for account_id queries
CREATE INDEX IF NOT EXISTS idx_events_account_id ON analytics.events (customer_id, timestamp DESC);

-- Rename last_login_at to last_login for consistency
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'dashboard' 
             AND table_name = 'users' 
             AND column_name = 'last_login_at') THEN
    ALTER TABLE dashboard.users RENAME COLUMN last_login_at TO last_login;
  END IF;
END $$;

