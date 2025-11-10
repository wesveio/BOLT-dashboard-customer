import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserOrNull } from '@/lib/api/auth';
import { performHealthCheck } from '@/lib/automation/health-check-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/health
 * Get health check for current user's account
 */
export async function GET(_request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserOrNull();

    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = authResult;
    const healthCheck = await performHealthCheck(user.account_id as string);

    return NextResponse.json(healthCheck);
  } catch (error) {
    console.error('❌ [DEBUG] Error performing health check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

