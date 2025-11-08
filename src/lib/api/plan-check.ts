/**
 * Plan Check Utility
 * 
 * Helper functions to check user plan access in API routes
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { Plan, Subscription, hasFeature } from '@/utils/plans';
import { isSessionValid } from '@/lib/api/auth';

/**
 * Get user's active subscription and plan
 */
export async function getUserPlan(): Promise<{
  subscription: Subscription | null;
  plan: Plan | null;
  hasEnterpriseAccess: boolean;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return {
        subscription: null,
        plan: null,
        hasEnterpriseAccess: false,
        error: 'Unauthorized',
      };
    }

    const supabase = getSupabaseAdmin();

    // Verify session
    const { data: sessions, error: sessionError } = await supabase.rpc(
      'get_session_by_token',
      { p_token: sessionToken }
    );

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (sessionError || !session) {
      return {
        subscription: null,
        plan: null,
        hasEnterpriseAccess: false,
        error: 'Invalid or expired session',
      };
    }

    // Validate session expiration (with timezone-safe buffer)
    if (!isSessionValid(session.expires_at)) {
      return {
        subscription: null,
        plan: null,
        hasEnterpriseAccess: false,
        error: 'Session expired',
      };
    }

    // Get user
    const { data: users, error: userError } = await supabase.rpc('get_user_by_id', {
      p_user_id: session.user_id,
    });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user || !user.account_id) {
      return {
        subscription: null,
        plan: null,
        hasEnterpriseAccess: false,
        error: 'User or account not found',
      };
    }

    // Fetch subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase.rpc(
      'get_subscriptions_by_account',
      { p_account_id: user.account_id }
    );

    if (subscriptionsError) {
      console.error('❌ [DEBUG] Error fetching subscriptions:', subscriptionsError);
      return {
        subscription: null,
        plan: null,
        hasEnterpriseAccess: false,
        error: 'Failed to fetch subscriptions',
      };
    }

    // Find active subscription
    const activeSubscription = (subscriptions || []).find(
      (sub: Subscription) => sub.status === 'active'
    );

    if (!activeSubscription) {
      return {
        subscription: null,
        plan: null,
        hasEnterpriseAccess: false,
        error: 'No active subscription',
      };
    }

    // Get plan details
    let plan: Plan | null = null;
    if (activeSubscription.plan) {
      plan = activeSubscription.plan;
    } else {
      // Fetch plan if not included
      const { data: plans, error: plansError } = await supabase.rpc('get_plans');
      if (!plansError && plans) {
        plan = plans.find((p: Plan) => p.id === activeSubscription.plan_id) || null;
      }
    }

    if (!plan) {
      return {
        subscription: activeSubscription,
        plan: null,
        hasEnterpriseAccess: false,
        error: 'Plan not found',
      };
    }

    // Check Enterprise access
    const isEnterprise = plan.code === 'enterprise';
    const hasBoltXFeature = hasFeature(plan, 'boltx');

    return {
      subscription: activeSubscription,
      plan,
      hasEnterpriseAccess: isEnterprise && hasBoltXFeature,
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error in getUserPlan:', error);
    return {
      subscription: null,
      plan: null,
      hasEnterpriseAccess: false,
      error: 'Internal server error',
    };
  }
}

