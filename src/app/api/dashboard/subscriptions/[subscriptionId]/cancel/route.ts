import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { isSessionValid } from '@/lib/api/auth';
import { getPaymentGatewayFromEnv } from '@/lib/payments/payment-gateway-factory';
import { calculatePeriodEnd } from '@/utils/plans';

/**
 * DELETE /api/dashboard/subscriptions/[subscriptionId]/cancel
 * Cancel a subscription
 * 
 * If there are successful transactions, the subscription will remain active until the end of the billing period.
 * If there are no transactions, the subscription will be cancelled immediately.
 */
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    const validationError = validateSupabaseAdmin();
    if (validationError) return validationError;

    const { subscriptionId } = params;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Verify session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Verify session and get user using RPC function
    const { data: sessions, error: sessionError } = await supabase
      .rpc('get_session_by_token', { p_token: sessionToken });

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (sessionError || !session) {
      console.error('🚨 [DEBUG] Session error:', sessionError);
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Validate session expiration
    if (!isSessionValid(session.expires_at)) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Get user to find account_id
    const { data: users, error: userError } = await supabase
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user || !user.account_id) {
      return NextResponse.json({ error: 'User or account not found' }, { status: 404 });
    }

    // Fetch subscription to verify ownership and status
    const { data: subscriptions, error: subError } = await supabase
      .rpc('get_subscriptions_by_account', { p_account_id: user.account_id });

    if (subError) {
      console.error('❌ [DEBUG] Error fetching subscriptions:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    const subscription = subscriptions?.find((s: any) => s.id === subscriptionId);

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Verify subscription belongs to user's account
    if (subscription.account_id !== user.account_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only active subscriptions can be cancelled
    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active subscriptions can be cancelled' },
        { status: 400 }
      );
    }

    // Get the last successful transaction for this subscription
    const { data: transactions, error: transactionsError } = await supabase
      .from('subscription_transactions')
      .select('transaction_date, status')
      .eq('subscription_id', subscriptionId)
      .eq('status', 'completed')
      .order('transaction_date', { ascending: false })
      .limit(1);

    if (transactionsError) {
      console.error('❌ [DEBUG] Error fetching transactions:', transactionsError);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    const paymentGateway = getPaymentGatewayFromEnv();
    const now = new Date();
    let endedAt: Date | null = null;

    // If there are no successful transactions, cancel immediately
    if (!transactions || transactions.length === 0) {
      endedAt = now;
      
      // Cancel immediately in payment gateway
      if (subscription.gateway_subscription_id) {
        try {
          await paymentGateway.cancelSubscription(subscription.gateway_subscription_id, true);
        } catch (gatewayError) {
          console.error('❌ [DEBUG] Error cancelling subscription in gateway:', gatewayError);
          // Continue with database update even if gateway fails
        }
      }

      // Update subscription: cancel immediately
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          ended_at: endedAt.toISOString(),
          cancelled_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('❌ [DEBUG] Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        cancelled: true,
        cancelledImmediately: true,
        endedAt: endedAt.toISOString(),
        message: 'Subscription cancelled immediately',
      });
    }

    // If there are successful transactions, calculate period end
    const lastTransaction = transactions[0];
    const lastTransactionDate = new Date(lastTransaction.transaction_date);
    endedAt = calculatePeriodEnd(lastTransactionDate, subscription.billing_cycle);

    // If period end is in the past, cancel immediately
    if (endedAt <= now) {
      endedAt = now;

      if (subscription.gateway_subscription_id) {
        try {
          await paymentGateway.cancelSubscription(subscription.gateway_subscription_id, true);
        } catch (gatewayError) {
          console.error('❌ [DEBUG] Error cancelling subscription in gateway:', gatewayError);
        }
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          ended_at: endedAt.toISOString(),
          cancelled_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('❌ [DEBUG] Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        cancelled: true,
        cancelledImmediately: true,
        endedAt: endedAt.toISOString(),
        message: 'Subscription cancelled immediately',
      });
    }

    // Cancel at period end in payment gateway
    if (subscription.gateway_subscription_id) {
      try {
        await paymentGateway.cancelSubscription(subscription.gateway_subscription_id, false);
      } catch (gatewayError) {
        console.error('❌ [DEBUG] Error cancelling subscription in gateway:', gatewayError);
        // Continue with database update even if gateway fails
      }
    }

    // Update subscription: set ended_at but keep status as 'active'
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        ended_at: endedAt.toISOString(),
        cancelled_at: now.toISOString(),
        updated_at: now.toISOString(),
        // Keep status as 'active' until ended_at
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('❌ [DEBUG] Error updating subscription:', updateError);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cancelled: true,
      cancelledImmediately: false,
      endedAt: endedAt.toISOString(),
      message: `Subscription will remain active until ${endedAt.toISOString()}`,
    });
  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in cancel subscription endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

