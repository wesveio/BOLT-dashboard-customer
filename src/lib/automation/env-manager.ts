/**
 * Environment Variables Manager
 * 
 * Generates and manages environment variables for account deployments.
 * Syncs env vars with Netlify and validates before deployment.
 */

import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Generate environment variables for an account
 */
export async function generateEnvVarsForAccount(
  accountId: string,
  vtexAccountName: string
): Promise<Record<string, string>> {
  const supabase = getSupabaseAdmin();

  // Get account info
  const { data: accounts, error: accountError } = await supabase.rpc(
    'get_account_by_id',
    { p_account_id: accountId }
  );

  if (accountError || !accounts || accounts.length === 0) {
    throw new Error('Account not found');
  }

  const account = accounts[0];

  // Get metrics API key
  const { data: apiKeys, error: apiKeyError } = await supabase.rpc(
    'get_metrics_api_key',
    { p_account_id: accountId }
  );

  const metricsApiKey = apiKeys && apiKeys.length > 0 ? '***' : null; // We can't retrieve full key

  // Get Supabase config
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Get dashboard URL
  const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dashboard.isbolt.com';

  // Build env vars
  const envVars: Record<string, string> = {
    // VTEX Configuration
    NEXT_PUBLIC_VTEX_ACCOUNT: vtexAccountName,

    // Multi-tenant mode
    NEXT_PUBLIC_MULTI_TENANT: 'true',
    NEXT_PUBLIC_ACCOUNT_RESOLUTION_MODE: 'subdomain',

    // Domain configuration
    NEXT_PUBLIC_BASE_DOMAIN: 'isbolt.com',
    NEXT_PUBLIC_CHECKOUT_DOMAIN: 'checkout.isbolt.com',
    NEXT_PUBLIC_DASHBOARD_URL: dashboardUrl,

    // Supabase (public URL only, service key should be set manually)
    ...(supabaseUrl && { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl }),

    // Metrics API (if available)
    ...(metricsApiKey && { NEXT_PUBLIC_METRICS_API_KEY: metricsApiKey }),
    NEXT_PUBLIC_METRICS_BOLT_URL: dashboardUrl,

    // App URL (for OAuth callbacks)
    NEXT_PUBLIC_APP_URL: `https://${vtexAccountName}.checkout.isbolt.com`,

    // Feature flags
    NEXT_PUBLIC_ENABLE_EVENT_TRACKING: 'true',
    NEXT_PUBLIC_ENABLE_BOLT_PLUGIN: 'true',
  };

  // Note: VTEX_APP_KEY and VTEX_APP_TOKEN should be set manually
  // or retrieved from a secure vault, not generated here

  return envVars;
}

/**
 * Validate environment variables before deployment
 */
export function validateEnvVars(envVars: Record<string, string>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required vars
  if (!envVars.NEXT_PUBLIC_VTEX_ACCOUNT) {
    errors.push('NEXT_PUBLIC_VTEX_ACCOUNT is required');
  }

  if (!envVars.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL is required');
  }

  // Validate URL format
  if (envVars.NEXT_PUBLIC_APP_URL && !envVars.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_APP_URL must start with https://');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sync environment variables with Netlify
 */
export async function syncEnvVarsToNetlify(
  netlifySiteId: string,
  envVars: Record<string, string>
): Promise<void> {
  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;

  if (!netlifyToken) {
    throw new Error('NETLIFY_ACCESS_TOKEN not configured');
  }

  // Validate before syncing
  const validation = validateEnvVars(envVars);
  if (!validation.isValid) {
    throw new Error(`Invalid env vars: ${validation.errors.join(', ')}`);
  }

  // Convert to Netlify format
  const netlifyEnvVars = Object.entries(envVars).map(([key, value]) => ({
    key,
    values: [{ value, context: 'all' }], // all = production, deploy-preview, branch-deploy
  }));

  const response = await fetch(`https://api.netlify.com/api/v1/sites/${netlifySiteId}/env`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${netlifyToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(netlifyEnvVars),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to sync env vars: ${error.message || response.statusText}`);
  }
}

/**
 * Rotate secrets (for security)
 * This would regenerate API keys and update them in Netlify
 */
export async function rotateSecrets(_accountId: string): Promise<void> {
  // This would:
  // 1. Generate new API keys
  // 2. Update them in database
  // 3. Update them in Netlify env vars
  // 4. Invalidate old keys

  // Implementation deferred - can be added later
  console.warn('⚠️ [DEBUG] Secret rotation not yet implemented');
}

