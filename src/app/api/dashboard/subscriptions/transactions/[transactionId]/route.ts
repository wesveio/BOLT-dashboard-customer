/**
 * GET /api/dashboard/subscriptions/transactions/[transactionId]
 * Get detailed transaction information including payment gateway details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { isSessionValid } from '@/lib/api/auth';
import { getPaymentGatewayFromEnv } from '@/lib/payments/payment-gateway-factory';
import { PaymentGatewayError } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
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
    const { data: sessions, error: sessionError } = await supabase
      .rpc('get_session_by_token', { p_token: sessionToken });

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (sessionError || !session) {
      console.error('🚨 [DEBUG] Session error:', sessionError);
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    if (!isSessionValid(session.expires_at)) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Get user and account
    const { data: users, error: userError } = await supabase
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user || !user.account_id) {
      return NextResponse.json({ error: 'User or account not found' }, { status: 404 });
    }

    const transactionId = params.transactionId;

    // Get transaction from database
    const { data: transaction, error: transactionError } = await supabase
      .from('subscription_transactions')
      .select(`
        *,
        subscription:subscriptions!inner(
          id,
          account_id,
          plan:plans(*)
        )
      `)
      .eq('id', transactionId)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify transaction belongs to user's account
    if (transaction.subscription.account_id !== user.account_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get payment gateway details if available
    let gatewayDetails = null;
    if (transaction.payment_provider && transaction.payment_intent_id) {
      try {
        const paymentGateway = getPaymentGatewayFromEnv();
        
        if (paymentGateway.getProvider() === transaction.payment_provider) {
          // Try to get transaction from gateway
          if (transaction.gateway_invoice_id) {
            gatewayDetails = await paymentGateway.getInvoice(transaction.gateway_invoice_id);
          } else if (transaction.payment_intent_id) {
            gatewayDetails = await paymentGateway.getTransaction(transaction.payment_intent_id);
          }
        }
      } catch (error: any) {
        console.error('❌ [DEBUG] Error fetching gateway transaction details:', error);
        // Don't fail if gateway details can't be fetched
      }
    }

    return NextResponse.json({
      transaction: {
        ...transaction,
        gateway_details: gatewayDetails,
      },
    });
  } catch (error: any) {
    console.error('❌ [DEBUG] Error in transaction details endpoint:', error);

    if (error instanceof PaymentGatewayError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

