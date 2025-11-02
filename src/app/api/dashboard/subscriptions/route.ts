import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * GET /api/dashboard/subscriptions
 * Get all subscriptions for the authenticated user's account
 */
export async function GET(request: NextRequest) {
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

    // Verify session and get user
    const { data: session, error: sessionError } = await supabase
      .from('dashboard.sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Get user to find account_id
    const { data: user, error: userError } = await supabase
      .from('dashboard.users')
      .select('account_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user || !user.account_id) {
      return NextResponse.json({ error: 'User or account not found' }, { status: 404 });
    }

    // Fetch subscriptions with plan details
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('dashboard.subscriptions')
      .select(`
        *,
        plan:dashboard.plans(*)
      `)
      .eq('account_id', user.account_id)
      .order('started_at', { ascending: false });

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

    // Verify session and get user
    const { data: session, error: sessionError } = await supabase
      .from('dashboard.sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Get user to find account_id
    const { data: user, error: userError } = await supabase
      .from('dashboard.users')
      .select('account_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user || !user.account_id) {
      return NextResponse.json({ error: 'User or account not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { plan_id, billing_cycle = 'monthly' } = body;

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    // Verify plan exists and is active
    const { data: plan, error: planError } = await supabase
      .from('dashboard.plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

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

    // Fetch the newly created subscription with plan details
    const { data: newSubscription, error: fetchError } = await supabase
      .from('dashboard.subscriptions')
      .select(`
        *,
        plan:dashboard.plans(*)
      `)
      .eq('id', subscriptionId)
      .single();

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

