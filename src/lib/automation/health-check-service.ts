/**
 * Health Check Service
 * 
 * Performs periodic health checks on accounts to ensure:
 * - VTEX integration is working
 * - Deployment is active
 * - API keys are valid
 * - Themes are configured
 * - Subscription is active
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { isAccountInDemoMode } from './demo-mode';

export interface HealthCheckResult {
  accountId: string;
  vtexAccountName: string;
  isHealthy: boolean;
  checks: {
    subscription: { status: 'pass' | 'fail' | 'warning'; message: string };
    vtexIntegration: { status: 'pass' | 'fail' | 'warning'; message: string };
    deployment: { status: 'pass' | 'fail' | 'warning'; message: string };
    apiKeys: { status: 'pass' | 'fail' | 'warning'; message: string };
    theme: { status: 'pass' | 'fail' | 'warning'; message: string };
  };
  timestamp: string;
}

/**
 * Perform health check for an account
 */
export async function performHealthCheck(accountId: string): Promise<HealthCheckResult> {
  const supabase = getSupabaseAdmin();
  const checks: HealthCheckResult['checks'] = {
    subscription: { status: 'fail', message: '' },
    vtexIntegration: { status: 'warning', message: '' },
    deployment: { status: 'warning', message: '' },
    apiKeys: { status: 'warning', message: '' },
    theme: { status: 'warning', message: '' },
  };

  // Get account info
  const { data: accounts, error: accountError } = await supabase.rpc(
    'get_account_by_id',
    { p_account_id: accountId }
  );

  if (accountError || !accounts || accounts.length === 0) {
    return {
      accountId,
      vtexAccountName: 'unknown',
      isHealthy: false,
      checks: {
        ...checks,
        subscription: { status: 'fail', message: 'Account not found' },
      },
      timestamp: new Date().toISOString(),
    };
  }

  const account = accounts[0];
  const vtexAccountName = account.vtex_account_name;

  // Check 1: Subscription status
  const isDemoMode = await isAccountInDemoMode(accountId);
  if (isDemoMode) {
    checks.subscription = {
      status: 'fail',
      message: 'No active subscription (demo mode)',
    };
  } else {
    checks.subscription = {
      status: 'pass',
      message: 'Active subscription found',
    };
  }

  // Check 2: VTEX Integration (basic check - just verify account name format)
  if (vtexAccountName && vtexAccountName.length >= 3) {
    checks.vtexIntegration = {
      status: 'pass',
      message: 'VTEX account name is valid',
    };
  } else {
    checks.vtexIntegration = {
      status: 'fail',
      message: 'Invalid VTEX account name',
    };
  }

  // Check 3: Deployment status
  const { data: deployments, error: deploymentError } = await supabase
    .from('dashboard.deployments')
    .select('status, url')
    .eq('account_id', accountId)
    .single();

  if (deploymentError || !deployments) {
    checks.deployment = {
      status: 'warning',
      message: 'No deployment record found (using shared deployment)',
    };
  } else if (deployments.status === 'ready') {
    checks.deployment = {
      status: 'pass',
      message: `Deployment active at ${deployments.url}`,
    };
  } else {
    checks.deployment = {
      status: 'fail',
      message: `Deployment status: ${deployments.status}`,
    };
  }

  // Check 4: API Keys
  const { data: apiKeys, error: apiKeyError } = await supabase.rpc(
    'get_metrics_api_key',
    { p_account_id: accountId }
  );

  if (apiKeyError || !apiKeys || apiKeys.length === 0) {
    checks.apiKeys = {
      status: 'warning',
      message: 'No metrics API key found',
    };
  } else {
    checks.apiKeys = {
      status: 'pass',
      message: 'Metrics API key exists',
    };
  }

  // Check 5: Active Theme
  const { data: themes, error: themeError } = await supabase.rpc(
    'get_active_theme',
    { p_account_id: accountId }
  );

  if (themeError || !themes || themes.length === 0) {
    checks.theme = {
      status: 'warning',
      message: 'No active theme found (using default)',
    };
  } else {
    checks.theme = {
      status: 'pass',
      message: `Active theme: ${themes[0].name}`,
    };
  }

  // Determine overall health
  const hasFailures = Object.values(checks).some(c => c.status === 'fail');
  const isHealthy = !hasFailures;

  return {
    accountId,
    vtexAccountName,
    isHealthy,
    checks,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Perform health check for all active accounts
 */
export async function performHealthChecksForAllAccounts(): Promise<HealthCheckResult[]> {
  const supabase = getSupabaseAdmin();

  // Get all active accounts (not suspended or cancelled)
  const { data: accounts, error } = await supabase.rpc(
    'get_all_accounts' // This function would need to be created
  );

  if (error || !accounts) {
    console.error('❌ [DEBUG] Error fetching accounts for health check:', error);
    return [];
  }

  // Filter to active accounts only
  const activeAccounts = accounts.filter((acc: any) =>
    acc.status === 'active' || acc.status === 'trial'
  );

  // Perform health checks in parallel (with limit to avoid overwhelming)
  const results = await Promise.all(
    activeAccounts.slice(0, 100).map((account: any) =>
      performHealthCheck(account.id)
    )
  );

  return results;
}

/**
 * Attempt to fix health check issues automatically
 */
export async function fixHealthCheckIssues(
  accountId: string,
  checkType: keyof HealthCheckResult['checks']
): Promise<{ success: boolean; message: string }> {
  // This would attempt to fix specific issues
  // For now, just log the attempt

  console.info(`✅ [DEBUG] Attempting to fix ${checkType} for account ${accountId}`);

  // Implementation would depend on the specific issue
  // For example:
  // - If API key missing, trigger onboarding
  // - If theme missing, create default theme
  // - If deployment failed, retry deployment

  return {
    success: false,
    message: 'Auto-fix not yet implemented',
  };
}

