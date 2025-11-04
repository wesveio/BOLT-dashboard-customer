import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * GET /api/dashboard/subscriptions
 * Get all subscriptions for the authenticated user's account
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const validationError = validateSupabaseAdmin();
    if (validationError) return validationError;

    // Verify session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Verify session and get user using RPC function (required for custom schema)
    const { data: sessions, error: sessionError } = await supabase
      .rpc('get_session_by_token', { p_token: sessionToken });

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (sessionError || !session) {
      console.error('🚨 [DEBUG] Session error:', sessionError);
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Validate session expiration (RPC already filters expired, but double-check)
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Get user to find account_id using RPC function (required for custom schema)
    const { data: users, error: userError } = await supabase
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user || !user.account_id) {
      return NextResponse.json({ error: 'User or account not found' }, { status: 404 });
    }

    // Fetch subscriptions with plan details using public function
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .rpc('get_subscriptions_by_account', { p_account_id: user.account_id });

    if (subscriptionsError) {
      console.error('❌ [DEBUG] Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    return NextResponse.json({
      subscriptions: subscriptions || [],
    });
  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in subscriptions endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/subscriptions
 * Create a new subscription or upgrade/downgrade existing one
 */
export async function POST(request: NextRequest) {
  try {
    const validationError = validateSupabaseAdmin();
    if (validationError) return validationError;

    // Verify session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Verify session and get user using RPC function (required for custom schema)
    const { data: sessions, error: sessionError } = await supabase
      .rpc('get_session_by_token', { p_token: sessionToken });

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (sessionError || !session) {
      console.error('🚨 [DEBUG] Session error:', sessionError);
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Validate session expiration (RPC already filters expired, but double-check)
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Get user to find account_id using RPC function (required for custom schema)
    const { data: users, error: userError } = await supabase
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user || !user.account_id) {
      return NextResponse.json({ error: 'User or account not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { plan_id, billing_cycle = 'monthly' } = body;

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    // Verify plan exists and is active using public function
    const { data: allPlans, error: plansError } = await supabase.rpc('get_plans');
    const plan = allPlans?.find((p: any) => p.id === plan_id);
    const planError = plansError || !plan ? { message: 'Plan not found' } : null;

    if (planError || !plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Create subscription using the function
    const { data: subscriptionIdResult, error: createError } = await supabase
      .rpc('dashboard.create_subscription', {
        p_account_id: user.account_id,
        p_plan_id: plan_id,
        p_billing_cycle: billing_cycle,
      });

    if (createError) {
      console.error('❌ [DEBUG] Error creating subscription:', createError);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    const subscriptionId = subscriptionIdResult;
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    // Fetch the newly created subscription with plan details using public function
    const { data: subscriptions, error: fetchError } = await supabase
      .rpc('get_subscriptions_by_account', { p_account_id: user.account_id });
    const newSubscription = subscriptions?.find((s: any) => s.id === subscriptionId);

    if (fetchError) {
      console.error('❌ [DEBUG] Error fetching new subscription:', fetchError);
    }

    return NextResponse.json({
      subscription: newSubscription || { id: subscriptionId },
      message: 'Subscription created successfully',
    });
  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in subscriptions POST endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

