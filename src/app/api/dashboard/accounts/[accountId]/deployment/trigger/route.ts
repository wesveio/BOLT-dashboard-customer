import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { triggerDeployment } from '@/lib/automation/deployment-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/dashboard/accounts/[accountId]/deployment/trigger
 * Trigger a new deployment for an account
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const authResult = await getAuthenticatedUser();
    const { user } = authResult;

    // Only owner and admin can trigger deployments
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can trigger deployments' },
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
    const branch = body.branch || 'main';

    const result = await triggerDeployment(params.accountId, branch);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to trigger deployment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deploymentId: result.deploymentId,
      message: 'Deployment triggered successfully',
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error triggering deployment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

