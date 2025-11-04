import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { Subscription } from '@/utils/plans';

/**
 * GET /api/dashboard/subscriptions/transactions
 * Get transaction history for the authenticated user's subscriptions
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

    // Get user's subscriptions using public function
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .rpc('get_subscriptions_by_account', { p_account_id: user.account_id });

    if (subscriptionsError) {
      console.error('❌ [DEBUG] Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const subscriptionIds = subscriptions?.map((s: Subscription) => s.id as string) || [];

    if (subscriptionIds.length === 0) {
      return NextResponse.json({ transactions: [] });
    }

    // Fetch transactions for these subscriptions using public function
    const { data: transactions, error: transactionsError } = await supabase
      .rpc('get_subscription_transactions', { p_subscription_ids: subscriptionIds });

    if (transactionsError) {
      console.error('❌ [DEBUG] Error fetching transactions:', transactionsError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({
      transactions: transactions || [],
    });
  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in transactions endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

