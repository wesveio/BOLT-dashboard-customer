-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE customer.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.theme_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.theme_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard.financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Get current user's account_id
-- ============================================================================

CREATE OR REPLACE FUNCTION dashboard.get_user_account_id(user_id UUID)
RETURNS UUID AS $$
  SELECT account_id FROM dashboard.users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- CUSTOMER.ACCOUNTS POLICIES
-- ============================================================================

-- Users can only see their own account
CREATE POLICY "Users can view their account"
  ON customer.accounts
  FOR SELECT
  USING (
    id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- ============================================================================
-- DASHBOARD.USERS POLICIES
-- ============================================================================

-- Users can view users from their account
CREATE POLICY "Users can view account users"
  ON dashboard.users
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Only owners and admins can insert new users
CREATE POLICY "Owners and admins can create users"
  ON dashboard.users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('owner', 'admin')
      AND account_id = dashboard.users.account_id
    )
  );

-- Owners can update any user, admins can only update non-owners
CREATE POLICY "Owners and admins can update users"
  ON dashboard.users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard.users current_user
      WHERE current_user.id = auth.uid()::UUID
      AND (
        (current_user.role = 'owner')
        OR (current_user.role = 'admin' AND dashboard.users.role != 'owner')
      )
      AND current_user.account_id = dashboard.users.account_id
    )
  );

-- Only owners can delete users
CREATE POLICY "Only owners can delete users"
  ON dashboard.users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role = 'owner'
      AND account_id = dashboard.users.account_id
    )
  );

-- ============================================================================
-- ANALYTICS.EVENTS POLICIES
-- ============================================================================

-- Customers can only see their own events
CREATE POLICY "Customers can view their events"
  ON analytics.events
  FOR SELECT
  USING (
    customer_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- ============================================================================
-- DASHBOARD.THEME_CONFIGS POLICIES
-- ============================================================================

-- Users can view themes from their account
CREATE POLICY "Users can view account themes"
  ON dashboard.theme_configs
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Editors, admins, and owners can create themes
CREATE POLICY "Editors+ can create themes"
  ON dashboard.theme_configs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('editor', 'admin', 'owner')
      AND account_id = dashboard.theme_configs.account_id
    )
  );

-- Editors, admins, and owners can update themes
CREATE POLICY "Editors+ can update themes"
  ON dashboard.theme_configs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('editor', 'admin', 'owner')
      AND account_id = dashboard.theme_configs.account_id
    )
  );

-- Admins and owners can delete themes
CREATE POLICY "Admins+ can delete themes"
  ON dashboard.theme_configs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dashboard.users
      WHERE id = auth.uid()::UUID
      AND role IN ('admin', 'owner')
      AND account_id = dashboard.theme_configs.account_id
    )
  );

-- ============================================================================
-- DASHBOARD.FINANCIAL_METRICS POLICIES
-- ============================================================================

-- Users can view financial metrics from their account
CREATE POLICY "Users can view account financial metrics"
  ON dashboard.financial_metrics
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM dashboard.users
      WHERE id = auth.uid()::UUID
    )
  );

-- Only system (service role) can insert/update financial metrics
-- (No policy needed as RLS is enforced, service role bypasses RLS)

