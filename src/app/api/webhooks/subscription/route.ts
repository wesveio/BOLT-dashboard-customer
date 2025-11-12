import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { triggerOnboarding } from '@/lib/automation/onboarding-service';
import { getPaymentGatewayFromEnv } from '@/lib/payments/payment-gateway-factory';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/subscription
 * 
 * Webhook handler for subscription events from payment providers (Stripe, Paddle, etc.)
 * 
 * Expected payload structure (generic, works with multiple providers):
 * {
 *   event_id?: string, // For idempotency
 *   event: 'subscription.created' | 'subscription.activated' | 'subscription.updated' | 'subscription.cancelled' | 'subscription.expired' | 'subscription.renewed' | 'subscription.paused',
 *   provider?: 'stripe' | 'paddle', // Payment provider
 *   subscription: {
 *     id: string, // Internal subscription ID (UUID)
 *     gateway_subscription_id?: string, // Gateway subscription ID
 *     account_id: string,
 *     plan_id: string,
 *     status: 'active' | 'pending' | 'cancelled' | 'expired' | 'paused',
 *     started_at?: string,
 *     ended_at?: string,
 *     ...
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature') ||
      request.headers.get('stripe-signature') ||
      request.headers.get('paddle-signature');

    // Verify webhook signature if signature and secret are provided
    const webhookSecret = process.env.SUBSCRIPTION_WEBHOOK_SECRET ||
      process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      try {
        const paymentGateway = getPaymentGatewayFromEnv();
        if (!paymentGateway.verifyWebhookSignature(rawBody, signature)) {
          console.error('❌ [DEBUG] Invalid webhook signature');
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          );
        }
      } catch (verifyError) {
        console.error('❌ [DEBUG] Error verifying webhook signature:', verifyError);
        return NextResponse.json(
          { error: 'Signature verification failed' },
          { status: 401 }
        );
      }
    } else if (webhookSecret && !signature) {
      console.warn('⚠️ [DEBUG] Webhook secret configured but no signature header found');
    }

    const body = JSON.parse(rawBody);
    const { event, subscription, event_id, provider } = body;

    // Validate required fields
    if (!event || !subscription) {
      return NextResponse.json(
        { error: 'Invalid webhook payload: missing event or subscription' },
        { status: 400 }
      );
    }

    if (!subscription.id || !subscription.account_id || !subscription.plan_id || !subscription.status) {
      return NextResponse.json(
        { error: 'Invalid webhook payload: missing required subscription fields' },
        { status: 400 }
      );
    }

    console.info(`✅ [DEBUG] Webhook] Received event: ${event}`, {
      event_id,
      subscription_id: subscription.id,
      account_id: subscription.account_id,
      status: subscription.status,
      provider,
    });

    const supabase = getSupabaseAdmin();

    // Idempotency check: verify if event was already processed
    if (event_id) {
      const { data: existingEvent, error: eventCheckError } = await supabase
        .from('subscription_transactions')
        .select('id')
        .eq('gateway_invoice_id', `webhook_${event_id}`)
        .single();

      if (!eventCheckError && existingEvent) {
        console.info(`✅ [DEBUG] Event ${event_id} already processed, skipping`);
        return NextResponse.json({ success: true, message: 'Event already processed' });
      }
    }

    // Helper function to update subscription in database
    const updateSubscriptionInDb = async (subscriptionData: any) => {
      const updateData: any = {
        status: subscriptionData.status,
        updated_at: new Date().toISOString(),
      };

      if (subscriptionData.started_at) {
        updateData.started_at = subscriptionData.started_at;
      }
      if (subscriptionData.ended_at) {
        updateData.ended_at = subscriptionData.ended_at;
      }
      if (subscriptionData.gateway_subscription_id) {
        updateData.gateway_subscription_id = subscriptionData.gateway_subscription_id;
      }
      if (provider) {
        updateData.payment_provider = provider;
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionData.id);

      if (updateError) {
        console.error('❌ [DEBUG] Error updating subscription in database:', updateError);
        throw updateError;
      }
    };

    // Handle different event types
    switch (event) {
      case 'subscription.created':
      case 'subscription.activated': {
        // Update subscription in database
        try {
          await updateSubscriptionInDb(subscription);
        } catch (updateError) {
          console.error('❌ [DEBUG] Error updating subscription:', updateError);
          // Continue processing even if update fails
        }

        // Check if this is the first subscription for this account
        const { data: existingSubscriptions, error: subError } = await supabase.rpc(
          'get_subscriptions_by_account',
          { p_account_id: subscription.account_id }
        );

        if (subError) {
          console.error('❌ [DEBUG] Error checking existing subscriptions:', subError);
          return NextResponse.json(
            { error: 'Failed to check subscriptions' },
            { status: 500 }
          );
        }

        // Check if this is the first active subscription
        const hasPreviousActiveSubscription = (existingSubscriptions || []).some(
          (sub: any) => sub.id !== subscription.id && sub.status === 'active'
        );

        // Only trigger onboarding if this is the first active subscription
        if (!hasPreviousActiveSubscription && subscription.status === 'active') {
          console.info(`✅ [DEBUG] First active subscription for account ${subscription.account_id}, triggering onboarding`);

          // Update account status and demo_mode
          const { error: updateError } = await supabase.rpc('update_account_demo_mode', {
            p_account_id: subscription.account_id,
          });

          if (updateError) {
            console.error('❌ [DEBUG] Error updating account demo mode:', updateError);
          }

          // Trigger onboarding service
          try {
            await triggerOnboarding(subscription.account_id, subscription.id);
          } catch (onboardingError) {
            console.error('❌ [DEBUG] Error triggering onboarding:', onboardingError);
            // Don't fail the webhook if onboarding fails - it can be retried
          }
        }

        // Record webhook event for idempotency
        if (event_id) {
          try {
            const { error: insertError } = await supabase.from('subscription_transactions').insert({
              subscription_id: subscription.id,
              status: 'completed',
              transaction_type: 'webhook',
              gateway_invoice_id: `webhook_${event_id}`,
              metadata: {
                event_type: event,
                webhook_event_id: event_id,
                provider,
              },
            });
            if (insertError) {
              console.warn('⚠️ [DEBUG] Could not record webhook event for idempotency:', insertError);
            }
          } catch (err: any) {
            console.warn('⚠️ [DEBUG] Could not record webhook event for idempotency:', err);
          }
        }

        break;
      }

      case 'subscription.updated': {
        // Update subscription in database
        try {
          await updateSubscriptionInDb(subscription);
        } catch (updateError) {
          console.error('❌ [DEBUG] Error updating subscription:', updateError);
        }

        // If subscription became active, check if onboarding is needed
        if (subscription.status === 'active') {
          // Update account demo_mode
          const { error: updateError } = await supabase.rpc('update_account_demo_mode', {
            p_account_id: subscription.account_id,
          });

          if (updateError) {
            console.error('❌ [DEBUG] Error updating account demo mode:', updateError);
          }

          // Check if onboarding was already completed
          const { data: onboardingStatus, error: onboardingError } = await supabase.rpc(
            'get_onboarding_status',
            { p_account_id: subscription.account_id }
          );

          // If onboarding not started or failed, trigger it
          if (!onboardingError && onboardingStatus) {
            const status = onboardingStatus[0]?.status;
            if (status === 'not_started' || status === 'failed') {
              console.info(`✅ [DEBUG] Triggering onboarding for account ${subscription.account_id}`);
              try {
                await triggerOnboarding(subscription.account_id, subscription.id);
              } catch (onboardingError) {
                console.error('❌ [DEBUG] Error triggering onboarding:', onboardingError);
              }
            }
          }
        } else if (subscription.status === 'cancelled' || subscription.status === 'expired') {
          // Update account to demo mode if subscription cancelled/expired
          const { error: updateError } = await supabase.rpc('update_account_demo_mode', {
            p_account_id: subscription.account_id,
          });

          if (updateError) {
            console.error('❌ [DEBUG] Error updating account demo mode:', updateError);
          }
        }

        // Record webhook event for idempotency
        if (event_id) {
          try {
            const { error: insertError } = await supabase.from('subscription_transactions').insert({
              subscription_id: subscription.id,
              status: 'completed',
              transaction_type: 'webhook',
              gateway_invoice_id: `webhook_${event_id}`,
              metadata: {
                event_type: event,
                webhook_event_id: event_id,
                provider,
              },
            });
            if (insertError) {
              console.warn('⚠️ [DEBUG] Could not record webhook event for idempotency:', insertError);
            }
          } catch (err: any) {
            console.warn('⚠️ [DEBUG] Could not record webhook event for idempotency:', err);
          }
        }

        break;
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        // Update subscription in database
        try {
          await updateSubscriptionInDb({
            ...subscription,
            ended_at: subscription.ended_at || new Date().toISOString(),
          });
        } catch (updateError) {
          console.error('❌ [DEBUG] Error updating subscription:', updateError);
        }

        // Update account to demo mode
        const { error: updateError } = await supabase.rpc('update_account_demo_mode', {
          p_account_id: subscription.account_id,
        });

        if (updateError) {
          console.error('❌ [DEBUG] Error updating account demo mode:', updateError);
        }

        // Record webhook event for idempotency
        if (event_id) {
          try {
            const { error: insertError } = await supabase.from('subscription_transactions').insert({
              subscription_id: subscription.id,
              status: 'completed',
              transaction_type: 'webhook',
              gateway_invoice_id: `webhook_${event_id}`,
              metadata: {
                event_type: event,
                webhook_event_id: event_id,
                provider,
              },
            });
            if (insertError) {
              console.warn('⚠️ [DEBUG] Could not record webhook event for idempotency:', insertError);
            }
          } catch (err: any) {
            console.warn('⚠️ [DEBUG] Could not record webhook event for idempotency:', err);
          }
        }

        break;
      }

      case 'subscription.renewed': {
        // Check if subscription is cancelled (has cancelled_at but still active)
        // If cancelled, don't process renewal - subscription should expire at ended_at
        const { data: existingSub, error: fetchError } = await supabase
          .from('subscriptions')
          .select('cancelled_at, ended_at, status')
          .eq('id', subscription.id)
          .single();

        if (!fetchError && existingSub) {
          // If subscription was cancelled (has cancelled_at), don't renew
          if (existingSub.cancelled_at && existingSub.status === 'active') {
            console.info(
              `⚠️ [DEBUG] Subscription ${subscription.id} is cancelled, skipping renewal`
            );
            return NextResponse.json({
              success: true,
              message: 'Renewal skipped - subscription is cancelled',
            });
          }
        }

        // Update subscription in database (renewal typically doesn't change status)
        try {
          await updateSubscriptionInDb(subscription);
        } catch (updateError) {
          console.error('❌ [DEBUG] Error updating subscription:', updateError);
        }

        console.info(`✅ [DEBUG] Subscription ${subscription.id} renewed for account ${subscription.account_id}`);

        // Record webhook event for idempotency
        if (event_id) {
          try {
            const { error: insertError } = await supabase.from('subscription_transactions').insert({
              subscription_id: subscription.id,
              status: 'completed',
              transaction_type: 'webhook',
              gateway_invoice_id: `webhook_${event_id}`,
              metadata: {
                event_type: event,
                webhook_event_id: event_id,
                provider,
              },
            });
            if (insertError) {
              console.warn('⚠️ [DEBUG] Could not record webhook event for idempotency:', insertError);
            }
          } catch (err: any) {
            console.warn('⚠️ [DEBUG] Could not record webhook event for idempotency:', err);
          }
        }

        break;
      }

      case 'subscription.paused': {
        // Update subscription in database
        try {
          await updateSubscriptionInDb(subscription);
        } catch (updateError) {
          console.error('❌ [DEBUG] Error updating subscription:', updateError);
        }

        console.info(`✅ [DEBUG] Subscription ${subscription.id} paused for account ${subscription.account_id}`);

        // Record webhook event for idempotency
        if (event_id) {
          try {
            const { error: insertError } = await supabase.from('subscription_transactions').insert({
              subscription_id: subscription.id,
              status: 'completed',
              transaction_type: 'webhook',
              gateway_invoice_id: `webhook_${event_id}`,
              metadata: {
                event_type: event,
                webhook_event_id: event_id,
                provider,
              },
            });
            if (insertError) {
              console.warn('⚠️ [DEBUG] Could not record webhook event for idempotency:', insertError);
            }
          } catch (err: any) {
            console.warn('⚠️ [DEBUG] Could not record webhook event for idempotency:', err);
          }
        }

        break;
      }

      default:
        console.warn(`⚠️ [DEBUG] Unhandled event type: ${event}`);
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [DEBUG] Error processing subscription webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

