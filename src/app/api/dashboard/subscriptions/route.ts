import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { isSessionValid } from '@/lib/api/auth';
import { getPaymentGatewayFromEnv } from '@/lib/payments/payment-gateway-factory';
import { validateCurrency, convertCurrency, CurrencyCode } from '@/lib/payments/currency-service';
import { PaymentGatewayError } from '@/lib/payments/types';

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

    // Validate session expiration (RPC already filters expired, but double-check with timezone-safe buffer)
    if (!isSessionValid(session.expires_at)) {
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

    // Validate session expiration (RPC already filters expired, but double-check with timezone-safe buffer)
    if (!isSessionValid(session.expires_at)) {
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
    const { plan_id, billing_cycle = 'monthly', payment_intent_id, currency = 'USD' } = body;

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

    // Validate currency
    let targetCurrency: CurrencyCode = 'USD';
    try {
      targetCurrency = validateCurrency(currency);
    } catch (error: any) {
      return NextResponse.json({ error: `Invalid currency: ${error.message}` }, { status: 400 });
    }

    // Get account information
    const { data: accounts, error: accountError } = await supabase
      .rpc('get_account_by_id', { p_account_id: user.account_id });

    const account = accounts && accounts.length > 0 ? accounts[0] : null;

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get payment gateway
    const paymentGateway = getPaymentGatewayFromEnv();

    // Get or create payment gateway customer
    let gatewayCustomerId = account.payment_gateway_customer_id;

    if (!gatewayCustomerId) {
      const customerResult = await paymentGateway.createCustomer({
        email: user.email || account.billing_email || '',
        name: user.name || account.name || undefined,
        metadata: {
          account_id: user.account_id,
          user_id: user.id,
        },
      });

      gatewayCustomerId = customerResult.customerId;

      // Update account with gateway customer ID
      await supabase
        .from('accounts')
        .update({ payment_gateway_customer_id: gatewayCustomerId })
        .eq('id', user.account_id);
    }

    // Convert price if needed (plans are stored in USD)
    const baseCurrency: CurrencyCode = 'USD';
    const planAmount = plan.monthly_price || 0;
    const finalAmount = targetCurrency === baseCurrency
      ? planAmount
      : convertCurrency(planAmount, baseCurrency, targetCurrency);

    // Create subscription in payment gateway
    let gatewaySubscription;
    try {
      gatewaySubscription = await paymentGateway.createSubscription({
        customerId: gatewayCustomerId,
        planId: plan.id,
        amount: finalAmount,
        currency: targetCurrency,
        billingCycle: billing_cycle,
        metadata: {
          plan_id: plan.id,
          plan_code: plan.code,
          account_id: user.account_id,
        },
      });
    } catch (error: any) {
      console.error('❌ [DEBUG] Error creating payment gateway subscription:', error);
      if (error instanceof PaymentGatewayError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode || 500 }
        );
      }
      throw error;
    }

    // Create subscription in database
    const { data: subscriptionIdResult, error: createError } = await supabase
      .rpc('create_subscription', {
        p_account_id: user.account_id,
        p_plan_id: plan_id,
        p_billing_cycle: billing_cycle,
      });

    if (createError) {
      console.error('❌ [DEBUG] Error creating subscription in database:', createError);
      // Try to cancel gateway subscription if database creation fails
      try {
        await paymentGateway.cancelSubscription(gatewaySubscription.subscriptionId, true);
      } catch (cancelError) {
        console.error('❌ [DEBUG] Error cancelling gateway subscription:', cancelError);
      }
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    const subscriptionId = subscriptionIdResult;
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    // Update subscription with gateway information
    await supabase
      .from('subscriptions')
      .update({
        payment_provider: paymentGateway.getProvider(),
        gateway_subscription_id: gatewaySubscription.subscriptionId,
        gateway_customer_id: gatewaySubscription.customerId,
      })
      .eq('id', subscriptionId);

    // Create initial transaction record
    if (payment_intent_id) {
      try {
        const transaction = await paymentGateway.getTransaction(payment_intent_id);
        
        await supabase.from('subscription_transactions').insert({
          subscription_id: subscriptionId,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status === 'completed' ? 'completed' : 'pending',
          transaction_type: 'subscription',
          payment_provider: paymentGateway.getProvider(),
          payment_intent_id: payment_intent_id,
          gateway_subscription_id: gatewaySubscription.subscriptionId,
          gateway_customer_id: gatewaySubscription.customerId,
          gateway_invoice_id: transaction.invoiceUrl ? transaction.id : undefined,
          receipt_url: transaction.receiptUrl,
          invoice_url: transaction.invoiceUrl,
          metadata: transaction.metadata,
        });
      } catch (transactionError) {
        console.error('❌ [DEBUG] Error creating transaction record:', transactionError);
        // Don't fail the subscription creation if transaction record fails
      }
    }

    // Fetch the newly created subscription with plan details
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

