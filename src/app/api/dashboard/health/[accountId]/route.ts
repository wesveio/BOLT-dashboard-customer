import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { performHealthCheck, fixHealthCheckIssues } from '@/lib/automation/health-check-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/health/[accountId]
 * Get health check for a specific account (admin only)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const authResult = await getAuthenticatedUser();
    const { user } = authResult;

    // Only owner and admin can view health checks for other accounts
    if (user.account_id !== params.accountId && user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const healthCheck = await performHealthCheck(params.accountId);

    return NextResponse.json(healthCheck);
  } catch (error) {
    console.error('❌ [DEBUG] Error performing health check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/health/[accountId]/fix
 * Attempt to fix health check issues (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const authResult = await getAuthenticatedUser();
    const { user } = authResult;

    // Only owner and admin can fix health issues
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can fix health issues' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { checkType } = body;

    if (!checkType) {
      return NextResponse.json(
        { error: 'checkType is required' },
        { status: 400 }
      );
    }

    const result = await fixHealthCheckIssues(params.accountId, checkType);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [DEBUG] Error fixing health check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

