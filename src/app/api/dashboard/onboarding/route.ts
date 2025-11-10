import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUserOrNull } from '@/lib/api/auth';
import { triggerOnboarding } from '@/lib/automation/onboarding-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/onboarding/status
 * Get onboarding status for the current user's account
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
    const supabase = getSupabaseAdmin();

    // Get onboarding status
    const { data: onboardingStatus, error } = await supabase.rpc(
      'get_onboarding_status',
      { p_account_id: user.account_id }
    );

    if (error) {
      console.error('❌ [DEBUG] Error fetching onboarding status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch onboarding status' },
        { status: 500 }
      );
    }

    const status = onboardingStatus && onboardingStatus.length > 0
      ? onboardingStatus[0]
      : {
        status: 'not_started',
        steps_completed: [],
        errors: [],
      };

    return NextResponse.json({
      status: status.status,
      stepsCompleted: status.steps_completed || [],
      errors: status.errors || [],
      triggeredAt: status.triggered_at,
      startedAt: status.started_at,
      completedAt: status.completed_at,
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in onboarding GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/onboarding/start
 * Manually start onboarding (admin only)
 * 
 * POST /api/dashboard/onboarding/retry
 * Retry failed onboarding steps
 */
export async function POST(_request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserOrNull();

    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = authResult;

    // Only admin and owner can manually trigger onboarding
    if (user.role !== 'admin' && user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can start onboarding' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if account has active subscription
    const { data: subscriptions } = await supabase.rpc(
      'get_subscriptions_by_account',
      { p_account_id: user.account_id }
    );

    const activeSubscription = (subscriptions || []).find(
      (sub: any) => sub.status === 'active'
    );

    if (!activeSubscription) {
      return NextResponse.json(
        { error: 'Account must have an active subscription to start onboarding' },
        { status: 400 }
      );
    }

    // Trigger onboarding
    const result = await triggerOnboarding(user.account_id as string, activeSubscription.id);

    return NextResponse.json({
      success: result.success,
      stepsCompleted: result.stepsCompleted,
      errors: result.errors,
      message: result.success
        ? 'Onboarding started successfully'
        : 'Onboarding started with some errors',
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in onboarding POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

