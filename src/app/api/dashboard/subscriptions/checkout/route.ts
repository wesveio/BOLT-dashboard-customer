/**
 * POST /api/dashboard/subscriptions/checkout
 * Create a checkout session for subscription payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { isSessionValid } from '@/lib/api/auth';
import { getPaymentGatewayFromEnv } from '@/lib/payments/payment-gateway-factory';
import { validateCurrency, CurrencyCode } from '@/lib/payments/currency-service';
import { PaymentGatewayError } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

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

    // Parse request body
    const body = await request.json();
    const { plan_id, currency = 'USD', payment_method_id } = body;

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    // Validate currency
    let targetCurrency: CurrencyCode = 'USD';
    try {
      targetCurrency = validateCurrency(currency);
    } catch (error: any) {
      return NextResponse.json({ error: `Invalid currency: ${error.message}` }, { status: 400 });
    }

    // Get plan
    const { data: allPlans, error: plansError } = await supabase.rpc('get_plans');
    const plan = allPlans?.find((p: any) => p.id === plan_id);

    if (plansError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
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
      // Create customer in payment gateway
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
      : (await import('@/lib/payments/currency-service')).convertCurrency(
          planAmount,
          baseCurrency,
          targetCurrency
        );

    // Create payment intent
    const paymentIntent = await paymentGateway.createPaymentIntent(
      finalAmount,
      targetCurrency,
      gatewayCustomerId,
      payment_method_id,
      {
        plan_id: plan.id,
        plan_code: plan.code,
        account_id: user.account_id,
      }
    );

    return NextResponse.json({
      client_secret: paymentIntent.clientSecret,
      payment_intent_id: paymentIntent.paymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      customer_id: gatewayCustomerId,
    });
  } catch (error: any) {
    console.error('❌ [DEBUG] Error in checkout endpoint:', error);

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

