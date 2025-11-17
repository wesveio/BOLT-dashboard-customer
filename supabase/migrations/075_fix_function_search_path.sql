-- ============================================================================
-- Migration: Fix function search_path for all functions
-- ============================================================================
-- Problem: All functions with SECURITY DEFINER don't have SET search_path defined
-- Solution: Add SET search_path to all functions to prevent search_path injection
-- ============================================================================
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- ============================================================================

-- ============================================================================
-- PUBLIC SCHEMA FUNCTIONS
-- ============================================================================
-- Set search_path = public, pg_catalog for all public schema functions

ALTER FUNCTION public.accept_user_invitation(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.activate_theme(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.check_theme_exists(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_account(text, text, text, text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_custom_api_key(uuid, text, text, text, text, text, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_dashboard(uuid, uuid, text, text, boolean, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_onboarding_status(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_session(uuid, text, text, timestamptz, timestamptz, text, text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_subscription(uuid, uuid, text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_theme(uuid, text, jsonb, uuid, text, boolean, boolean, varchar(50), boolean) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_user(uuid, text, text, text, text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_user_invitation(uuid, text, text, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.deactivate_all_themes(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.delete_account(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.delete_api_key(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.delete_dashboard(uuid, uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.delete_session_by_refresh_token(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.delete_session_by_token(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.delete_theme(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.delete_user(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.delete_vtex_credentials(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.duplicate_dashboard(uuid, uuid, uuid, text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.duplicate_theme(uuid, uuid, text, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_account_by_id(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_account_by_vtex_name(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_account_user_count(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_active_theme(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_ai_insights(uuid, text, integer) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_ai_interventions(uuid, timestamptz, timestamptz, text, boolean, text, integer) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_ai_optimizations(uuid, text, text, integer) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_ai_predictions(uuid, text, integer, integer) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_analytics_events(uuid, timestamptz, timestamptz, text[], text[]) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_analytics_events_by_types(uuid, text[], timestamptz, timestamptz) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_api_keys_by_account(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_app_feature_flags(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_auth_code_for_verification(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_boltx_configuration(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_dashboard_by_id(uuid, uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_dashboards_by_account(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_deployment_by_account(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_metrics_api_key(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_onboarding_status(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_plan_user_limit(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_plans() SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_recent_auth_codes(text, integer) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_session_by_token(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_subscription_transactions(uuid[]) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_subscriptions_by_account(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_theme_by_id(uuid, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_themes_by_account(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_user_by_email(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_user_by_id(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_user_invitations_by_account(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_user_profiles(uuid, timestamptz, timestamptz, text, text, integer) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_user_settings(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_users_by_account(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_vtex_credentials(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.increment_auth_code_attempts(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.insert_ai_insights(jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.insert_ai_optimization(uuid, text, text, text, jsonb, text, timestamptz) SET search_path = public, pg_catalog;
ALTER FUNCTION public.insert_analytics_events(jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.insert_auth_code(text, text, text, timestamptz, text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.mark_auth_code_used(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.resend_user_invitation(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_ai_optimization(uuid, uuid, text, jsonb, timestamptz) SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_dashboard(uuid, uuid, uuid, text, text, boolean, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_expired_cancelled_subscriptions() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_onboarding_status(uuid, text, jsonb, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_theme(uuid, uuid, text, jsonb, text, varchar(50)) SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_user_last_login(uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_user_settings(uuid, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.upsert_app_feature_flags(uuid, boolean, boolean, boolean, boolean) SET search_path = public, pg_catalog;
ALTER FUNCTION public.upsert_boltx_configuration(uuid, boolean, text, text, text, integer, numeric, boolean, integer, integer, text, boolean, boolean, boolean, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.upsert_deployment(uuid, text, text, text, text, text, jsonb) SET search_path = public, pg_catalog;
ALTER FUNCTION public.upsert_metrics_api_key(uuid, text, text, text, uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.upsert_vtex_credentials(uuid, text, text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.verify_api_key(text, uuid) SET search_path = public, pg_catalog;

-- ============================================================================
-- CUSTOMER SCHEMA FUNCTIONS
-- ============================================================================
-- Set search_path = customer, public, pg_catalog for customer schema functions

ALTER FUNCTION customer.normalize_vtex_account(text) SET search_path = customer, public, pg_catalog;
ALTER FUNCTION customer.update_account_demo_mode(uuid) SET search_path = customer, public, pg_catalog;

-- ============================================================================
-- DASHBOARD SCHEMA FUNCTIONS
-- ============================================================================
-- Set search_path = dashboard, public, pg_catalog for dashboard schema functions

ALTER FUNCTION dashboard.calculate_subscription_period_end(uuid) SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.check_auth_code_rate_limit(text, integer, integer) SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.cleanup_expired_auth_codes() SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.cleanup_expired_sessions() SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.create_subscription(uuid, uuid, text) SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.get_current_subscription(uuid) SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.get_user_account_id(uuid) SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.revoke_old_sessions(uuid, integer) SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.update_dashboards_updated_at() SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.update_expired_cancelled_subscriptions() SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.update_updated_at_column() SET search_path = dashboard, public, pg_catalog;
ALTER FUNCTION dashboard.update_user_invitations_updated_at() SET search_path = dashboard, public, pg_catalog;

-- ============================================================================
-- ANALYTICS SCHEMA FUNCTIONS
-- ============================================================================
-- Set search_path = analytics, public, pg_catalog for analytics schema functions

ALTER FUNCTION analytics.calculate_optimization_metrics(uuid, uuid, timestamptz, timestamptz, text) SET search_path = analytics, public, pg_catalog;
ALTER FUNCTION analytics.get_latest_prediction(text) SET search_path = analytics, public, pg_catalog;
ALTER FUNCTION analytics.insert_ai_intervention(uuid, text, text, integer, text, text, jsonb) SET search_path = analytics, public, pg_catalog;
ALTER FUNCTION analytics.insert_ai_prediction(uuid, text, integer, text, text, text, numeric, jsonb, jsonb, boolean, text) SET search_path = analytics, public, pg_catalog;
ALTER FUNCTION analytics.refresh_cohort_views() SET search_path = analytics, public, pg_catalog;
ALTER FUNCTION analytics.refresh_ltv_views() SET search_path = analytics, public, pg_catalog;
ALTER FUNCTION analytics.refresh_materialized_views() SET search_path = analytics, public, pg_catalog;
ALTER FUNCTION analytics.refresh_retention_views() SET search_path = analytics, public, pg_catalog;
ALTER FUNCTION analytics.update_user_profile(text, uuid, text, text, jsonb, jsonb, jsonb, jsonb) SET search_path = analytics, public, pg_catalog;
