/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { getPaymentGatewayFromEnv } from '@/lib/payments/payment-gateway-factory';
import { PaymentGatewayError } from '@/lib/payments/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const validationError = validateSupabaseAdmin();
    if (validationError) return validationError;

    const supabase = getSupabaseAdmin();
    const paymentGateway = getPaymentGatewayFromEnv();

    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ [DEBUG] Missing Stripe signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    if (!paymentGateway.verifyWebhookSignature(body, signature)) {
      console.error('❌ [DEBUG] Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook event
    const event = JSON.parse(body);

    console.info('✅ [DEBUG] Processing Stripe webhook', {
      type: event.type,
      id: event.id,
    });

    // Handle webhook event
    const result = await paymentGateway.handleWebhook({
      id: event.id,
      type: event.type,
      data: event.data,
      created: event.created,
    });

    if (!result.processed) {
      console.warn('⚠️ [DEBUG] Webhook event not processed', { type: event.type });
      return NextResponse.json({ received: true, processed: false });
    }

    // Process the event based on type
    const eventData = result.data;

    switch (result.type) {
      case 'payment_succeeded': {
        // Find subscription by gateway subscription ID
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('id, account_id')
          .eq('gateway_subscription_id', eventData.subscriptionId)
          .single();

        if (subError || !subscriptions) {
          console.error('❌ [DEBUG] Subscription not found for webhook', {
            subscriptionId: eventData.subscriptionId,
            error: subError,
          });
          break;
        }

        // Create or update transaction record
        const { error: transactionError } = await supabase
          .from('subscription_transactions')
          .upsert(
            {
              subscription_id: subscriptions.id,
              amount: eventData.amount,
              currency: eventData.currency,
              status: 'completed',
              transaction_type: 'subscription',
              payment_provider: paymentGateway.getProvider(),
              gateway_subscription_id: eventData.subscriptionId,
              gateway_customer_id: eventData.customerId,
              gateway_invoice_id: eventData.invoiceId,
              transaction_date: new Date().toISOString(),
              metadata: {
                webhook_event_id: event.id,
                webhook_type: event.type,
              },
            },
            {
              onConflict: 'gateway_invoice_id',
            }
          );

        if (transactionError) {
          console.error('❌ [DEBUG] Error creating transaction from webhook:', transactionError);
        }

        break;
      }

      case 'payment_failed': {
        // Find subscription by gateway subscription ID
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('gateway_subscription_id', eventData.subscriptionId)
          .single();

        if (subError || !subscriptions) {
          console.error('❌ [DEBUG] Subscription not found for failed payment webhook', {
            subscriptionId: eventData.subscriptionId,
          });
          break;
        }

        // Create failed transaction record
        await supabase.from('subscription_transactions').insert({
          subscription_id: subscriptions.id,
          amount: eventData.amount,
          currency: eventData.currency,
          status: 'failed',
          transaction_type: 'subscription',
          payment_provider: paymentGateway.getProvider(),
          gateway_subscription_id: eventData.subscriptionId,
          gateway_customer_id: eventData.customerId,
          gateway_invoice_id: eventData.invoiceId,
          transaction_date: new Date().toISOString(),
          metadata: {
            webhook_event_id: event.id,
            webhook_type: event.type,
            failure_reason: 'Payment failed',
          },
        });

        // Optionally update subscription status
        // await supabase
        //   .from('subscriptions')
        //   .update({ status: 'pending' })
        //   .eq('id', subscriptions.id);

        break;
      }

      case 'subscription_updated': {
        // Update subscription status if needed
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: eventData.status === 'active' ? 'active' : 'pending',
          })
          .eq('gateway_subscription_id', eventData.subscriptionId);

        if (updateError) {
          console.error('❌ [DEBUG] Error updating subscription from webhook:', updateError);
        }

        break;
      }

      case 'subscription_cancelled': {
        // Find subscription first to check if it was already cancelled
        const { data: existingSub, error: fetchError } = await supabase
          .from('subscriptions')
          .select('id, cancelled_at, ended_at, status')
          .eq('gateway_subscription_id', eventData.subscriptionId)
          .single();

        if (fetchError || !existingSub) {
          console.error('❌ [DEBUG] Subscription not found for cancellation webhook:', fetchError);
          break;
        }

        // If already cancelled, just update ended_at if needed
        if (existingSub.cancelled_at) {
          // Subscription was already cancelled, just ensure ended_at is set
          if (!existingSub.ended_at || existingSub.ended_at > new Date().toISOString()) {
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                ended_at: new Date().toISOString(),
                status: 'cancelled',
              })
              .eq('id', existingSub.id);

            if (updateError) {
              console.error('❌ [DEBUG] Error updating cancelled subscription:', updateError);
            }
          }
        } else {
          // Cancel subscription in database
          const { error: cancelError } = await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              ended_at: new Date().toISOString(),
              cancelled_at: new Date().toISOString(),
            })
            .eq('gateway_subscription_id', eventData.subscriptionId);

          if (cancelError) {
            console.error('❌ [DEBUG] Error cancelling subscription from webhook:', cancelError);
          }
        }

        break;
      }

      case 'refund_processed': {
        // Create refund transaction record
        // Find related transaction first
        const { data: originalTransaction } = await supabase
          .from('subscription_transactions')
          .select('subscription_id')
          .eq('payment_intent_id', eventData.chargeId)
          .single();

        if (originalTransaction) {
          await supabase.from('subscription_transactions').insert({
            subscription_id: originalTransaction.subscription_id,
            amount: eventData.amount,
            currency: eventData.currency,
            status: 'refunded',
            transaction_type: 'refund',
            payment_provider: paymentGateway.getProvider(),
            transaction_date: new Date().toISOString(),
            metadata: {
              webhook_event_id: event.id,
              webhook_type: event.type,
              original_charge_id: eventData.chargeId,
            },
          });
        }

        break;
      }

      default:
        console.warn('⚠️ [DEBUG] Unhandled webhook event type', { type: result.type });
    }

    // After processing any event, check and update expired cancelled subscriptions
    try {
      const { error: updateError } = await supabase.rpc('update_expired_cancelled_subscriptions');
      if (updateError) {
        console.warn('⚠️ [DEBUG] Error updating expired cancelled subscriptions:', updateError);
      }
    } catch (err: any) {
      console.warn('⚠️ [DEBUG] Error calling update_expired_cancelled_subscriptions:', err);
    }

    return NextResponse.json({ received: true, processed: result.processed });
  } catch (error: any) {
    console.error('❌ [DEBUG] Error processing Stripe webhook:', error);

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

