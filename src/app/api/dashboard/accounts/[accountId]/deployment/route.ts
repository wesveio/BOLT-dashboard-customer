import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { createNetlifyDeployment, getDeploymentStatus } from '@/lib/automation/deployment-service';
import { generateEnvVarsForAccount } from '@/lib/automation/env-manager';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/accounts/[accountId]/deployment/status
 * Get deployment status for an account
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const authResult = await getAuthenticatedUser();
    const { user } = authResult;

    // Verify user has access to this account
    if (user.account_id !== params.accountId && user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const status = await getDeploymentStatus(params.accountId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('❌ [DEBUG] Error getting deployment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/accounts/[accountId]/deployment
 * Create a new deployment for an account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const authResult = await getAuthenticatedUser();
    const { user } = authResult;

    // Only owner and admin can create deployments
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can create deployments' },
        { status: 403 }
      );
    }

    // Verify user has access to this account
    if (user.account_id !== params.accountId && user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { deploymentType = 'shared', customDomain, githubRepo, githubBranch = 'main' } = body;

    const supabase = getSupabaseAdmin();

    // Get account info
    const { data: accounts, error: accountError } = await supabase.rpc(
      'get_account_by_id',
      { p_account_id: params.accountId }
    );

    if (accountError || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const account = accounts[0];
    const vtexAccountName = account.vtex_account_name;

    // Generate environment variables for the account
    const envVars = await generateEnvVarsForAccount(params.accountId, vtexAccountName);

    // Create deployment
    const result = await createNetlifyDeployment({
      accountId: params.accountId,
      vtexAccountName,
      deploymentType,
      customDomain,
      githubRepo: githubRepo || process.env.GITHUB_REPO_CHECKOUT || '',
      githubBranch,
      envVars,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create deployment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deploymentId: result.deploymentId,
      netlifySiteId: result.netlifySiteId,
      url: result.url,
    }, { status: 201 });
  } catch (error) {
    console.error('❌ [DEBUG] Error creating deployment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/accounts/[accountId]/deployment/env
 * Update environment variables for a deployment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const authResult = await getAuthenticatedUser();
    const { user } = authResult;

    // Only owner and admin can update deployments
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can update deployments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { envVars } = body;

    if (!envVars || typeof envVars !== 'object') {
      return NextResponse.json(
        { error: 'Invalid envVars format' },
        { status: 400 }
      );
    }

    // Update env vars in Netlify (if dedicated deployment)
    // This will be implemented when we have the deployment record
    // For now, just update the database

    const supabase = getSupabaseAdmin();
    const { error: updateError } = await supabase
      .from('dashboard.deployments')
      .update({
        env_vars: envVars,
        updated_at: new Date().toISOString(),
      })
      .eq('account_id', params.accountId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update env vars' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [DEBUG] Error updating deployment env vars:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

