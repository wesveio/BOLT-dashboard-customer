import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { triggerOnboarding } from '@/lib/automation/onboarding-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/subscription
 * 
 * Webhook handler for subscription events from payment providers (Stripe, Paddle, etc.)
 * 
 * Expected payload structure (generic, works with multiple providers):
 * {
 *   event: 'subscription.created' | 'subscription.activated' | 'subscription.updated',
 *   subscription: {
 *     id: string,
 *     account_id: string,
 *     plan_id: string,
 *     status: 'active' | 'pending' | 'cancelled' | 'expired',
 *     ...
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (if using Stripe/Paddle)
    const webhookSecret = process.env.SUBSCRIPTION_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-webhook-signature');
      // TODO: Implement signature verification based on provider
      // For now, we'll trust the request if secret is configured
    }

    const body = await request.json();
    const { event, subscription } = body;

    if (!event || !subscription) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    console.info(`✅ [DEBUG] Webhook] Received event: ${event}`);

    const supabase = getSupabaseAdmin();

    // Handle different event types
    switch (event) {
      case 'subscription.created':
      case 'subscription.activated': {
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

        break;
      }

      case 'subscription.updated': {
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
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        // Update account to demo mode
        const { error: updateError } = await supabase.rpc('update_account_demo_mode', {
          p_account_id: subscription.account_id,
        });
        
        if (updateError) {
          console.error('❌ [DEBUG] Error updating account demo mode:', updateError);
        }
        break;
      }

      default:
        console.warn(`⚠️ [DEBUG] Unhandled event type: ${event}`);
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

