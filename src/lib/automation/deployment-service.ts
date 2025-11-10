/**
 * Deployment Service
 * 
 * Handles automated deployments to Netlify for Enterprise clients.
 * Creates dedicated deployments with custom domains and environment variables.
 */

import { getSupabaseAdmin } from '@/lib/supabase';

export interface DeploymentConfig {
  accountId: string;
  vtexAccountName: string;
  deploymentType: 'shared' | 'dedicated';
  customDomain?: string;
  githubRepo: string;
  githubBranch?: string;
  envVars: Record<string, string>;
}

export interface DeploymentResult {
  success: boolean;
  deploymentId?: string;
  netlifySiteId?: string;
  url?: string;
  error?: string;
}

/**
 * Create a Netlify deployment for an account
 */
export async function createNetlifyDeployment(
  config: DeploymentConfig
): Promise<DeploymentResult> {
  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
  const netlifyTeamId = process.env.NETLIFY_TEAM_ID;

  if (!netlifyToken) {
    return {
      success: false,
      error: 'NETLIFY_ACCESS_TOKEN not configured',
    };
  }

  try {
    // For shared deployments, we don't create a new site
    // They use the main checkout deployment with subdomain routing
    if (config.deploymentType === 'shared') {
      const url = `https://${config.vtexAccountName}.checkout.isbolt.com`;
      
      // Store deployment info in database
      await storeDeploymentInfo(config.accountId, {
        deploymentType: 'shared',
        platform: 'netlify',
        url,
        status: 'ready',
      });

      return {
        success: true,
        url,
      };
    }

    // For dedicated deployments, create a new Netlify site
    if (config.deploymentType === 'dedicated') {
      return await createDedicatedNetlifySite(config, netlifyToken, netlifyTeamId);
    }

    return {
      success: false,
      error: 'Invalid deployment type',
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error creating Netlify deployment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a dedicated Netlify site for Enterprise client
 */
async function createDedicatedNetlifySite(
  config: DeploymentConfig,
  netlifyToken: string,
  netlifyTeamId?: string
): Promise<DeploymentResult> {
  try {
    // Step 1: Create Netlify site
    const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `checkout-${config.vtexAccountName}`,
        ...(netlifyTeamId && { account_slug: netlifyTeamId }),
      }),
    });

    if (!siteResponse.ok) {
      const error = await siteResponse.json();
      throw new Error(`Failed to create Netlify site: ${error.message || siteResponse.statusText}`);
    }

    const site = await siteResponse.json();
    const netlifySiteId = site.id;
    const siteUrl = site.ssl_url || site.url;

    // Step 2: Configure environment variables
    if (Object.keys(config.envVars).length > 0) {
      await setNetlifyEnvVars(netlifySiteId, config.envVars, netlifyToken);
    }

    // Step 3: Link GitHub repository (if configured)
    if (config.githubRepo) {
      await linkGitHubRepo(netlifySiteId, config.githubRepo, config.githubBranch || 'main', netlifyToken);
    }

    // Step 4: Configure custom domain (if provided)
    if (config.customDomain) {
      await configureCustomDomain(netlifySiteId, config.customDomain, netlifyToken);
    }

    // Step 5: Store deployment info in database
    await storeDeploymentInfo(config.accountId, {
      deploymentType: 'dedicated',
      platform: 'netlify',
      netlifySiteId,
      url: config.customDomain ? `https://${config.customDomain}` : siteUrl,
      status: 'ready',
      envVars: config.envVars,
    });

    return {
      success: true,
      netlifySiteId,
      url: config.customDomain ? `https://${config.customDomain}` : siteUrl,
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error creating dedicated Netlify site:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Set environment variables for a Netlify site
 */
async function setNetlifyEnvVars(
  siteId: string,
  envVars: Record<string, string>,
  token: string
): Promise<void> {
  // Netlify API requires setting env vars one by one or in bulk
  // We'll use the bulk endpoint
  const envVarsArray = Object.entries(envVars).map(([key, value]) => ({
    key,
    values: [{ value, context: 'all' }], // all = production, deploy-preview, branch-deploy
  }));

  const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/env`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(envVarsArray),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to set env vars: ${error.message || response.statusText}`);
  }
}

/**
 * Link GitHub repository to Netlify site
 */
async function linkGitHubRepo(
  siteId: string,
  repo: string,
  branch: string,
  token: string
): Promise<void> {
  // Parse repo owner and name
  const [owner, repoName] = repo.split('/');
  
  if (!owner || !repoName) {
    throw new Error('Invalid GitHub repository format. Expected: owner/repo');
  }

  const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      repo: {
        provider: 'github',
        repo: repoName,
        repo_path: owner,
        branch,
        dir: 'bckstg-checkout', // Subdirectory if needed
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to link GitHub repo: ${error.message || response.statusText}`);
  }
}

/**
 * Configure custom domain for Netlify site
 */
async function configureCustomDomain(
  siteId: string,
  domain: string,
  token: string
): Promise<void> {
  // Add domain to site
  const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/domains`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      domain,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to configure domain: ${error.message || response.statusText}`);
  }
}

/**
 * Store deployment information in database
 */
async function storeDeploymentInfo(
  accountId: string,
  info: {
    deploymentType: 'shared' | 'dedicated';
    platform: 'netlify';
    netlifySiteId?: string;
    url: string;
    status: 'pending' | 'building' | 'ready' | 'failed';
    envVars?: Record<string, string>;
  }
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Check if deployment record exists
  const { data: existing, error: checkError } = await supabase
    .from('dashboard.deployments')
    .select('id')
    .eq('account_id', accountId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is fine
    throw new Error(`Failed to check existing deployment: ${checkError.message}`);
  }

  if (existing) {
    // Update existing deployment
    const { error: updateError } = await supabase
      .from('dashboard.deployments')
      .update({
        deployment_type: info.deploymentType,
        platform: info.platform,
        netlify_site_id: info.netlifySiteId || null,
        url: info.url,
        status: info.status,
        env_vars: info.envVars || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(`Failed to update deployment: ${updateError.message}`);
    }
  } else {
    // Create new deployment record
    const { error: createError } = await supabase
      .from('dashboard.deployments')
      .insert({
        account_id: accountId,
        deployment_type: info.deploymentType,
        platform: info.platform,
        netlify_site_id: info.netlifySiteId || null,
        url: info.url,
        status: info.status,
        env_vars: info.envVars || {},
      });

    if (createError) {
      throw new Error(`Failed to create deployment record: ${createError.message}`);
    }
  }
}

/**
 * Get deployment status for an account
 */
export async function getDeploymentStatus(accountId: string): Promise<{
  status: 'pending' | 'building' | 'ready' | 'failed' | null;
  url: string | null;
  error: string | null;
}> {
  const supabase = getSupabaseAdmin();

  const { data: deployments, error } = await supabase
    .from('dashboard.deployments')
    .select('status, url')
    .eq('account_id', accountId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No deployment found
      return {
        status: null,
        url: null,
        error: null,
      };
    }
    return {
      status: null,
      url: null,
      error: error.message,
    };
  }

  return {
    status: deployments?.status || null,
    url: deployments?.url || null,
    error: null,
  };
}

/**
 * Trigger a new deployment via GitHub webhook
 */
export async function triggerDeployment(
  accountId: string,
  _branch: string = 'main'
): Promise<DeploymentResult> {
  const supabase = getSupabaseAdmin();

  // Get deployment info
  const { data: deployment, error } = await supabase
    .from('dashboard.deployments')
    .select('*')
    .eq('account_id', accountId)
    .single();

  if (error || !deployment) {
    return {
      success: false,
      error: 'Deployment not found',
    };
  }

  if (deployment.platform !== 'netlify' || !deployment.netlify_site_id) {
    return {
      success: false,
      error: 'Invalid deployment configuration',
    };
  }

  const netlifyToken = process.env.NETLIFY_ACCESS_TOKEN;
  if (!netlifyToken) {
    return {
      success: false,
      error: 'NETLIFY_ACCESS_TOKEN not configured',
    };
  }

  try {
    // Trigger build via Netlify API
    const response = await fetch(
      `https://api.netlify.com/api/v1/sites/${deployment.netlify_site_id}/builds`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clear_cache: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to trigger deployment: ${error.message || response.statusText}`);
    }

    // Update status to building
    await supabase
      .from('dashboard.deployments')
      .update({
        status: 'building',
        updated_at: new Date().toISOString(),
      })
      .eq('id', deployment.id);

    return {
      success: true,
      deploymentId: deployment.id,
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error triggering deployment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

