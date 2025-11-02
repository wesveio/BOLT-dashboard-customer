import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * GET /api/dashboard/subscriptions/transactions
 * Get transaction history for the authenticated user's subscriptions
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

    // Get user's subscriptions using public function
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .rpc('get_subscriptions_by_account', { p_account_id: user.account_id });

    if (subscriptionsError) {
      console.error('❌ [DEBUG] Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const subscriptionIds = subscriptions?.map((s: any) => s.id) || [];

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

