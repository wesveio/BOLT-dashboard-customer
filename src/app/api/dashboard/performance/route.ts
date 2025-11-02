import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';

/**
 * GET /api/dashboard/performance
 * Get detailed performance metrics for the authenticated user's account
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get performance data from analytics.events
    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Calculate date range
    const range = getDateRange(period);

    // Query all checkout events using RPC function (required for custom schema)
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: [
          'checkout_start',
          'cart_view',
          'profile_step',
          'shipping_step',
          'payment_step',
          'checkout_complete',
        ],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('Get performance metrics error:', eventsError);
      return apiError('Failed to fetch performance metrics', 500);
    }

    // Calculate funnel metrics
    const funnelSteps = {
      cart: 0,
      profile: 0,
      shipping: 0,
      payment: 0,
      confirmed: 0,
    };

    const stepTimes: Record<string, number[]> = {
      cart: [],
      profile: [],
      shipping: [],
      payment: [],
    };

    // Group events by session
    const checkoutSessions: Record<string, {
      start: Date;
      steps: string[];
      times: Record<string, number>;
    }> = {};

    events?.forEach((event) => {
      const sessionId = event.session_id;
      if (!checkoutSessions[sessionId]) {
        checkoutSessions[sessionId] = {
          start: new Date(event.timestamp),
          steps: [],
          times: {},
        };
      }

      const session = checkoutSessions[sessionId];
      const eventTime = new Date(event.timestamp).getTime();
      const sessionStart = session.start.getTime();

      switch (event.event_type) {
        case 'cart_view':
          funnelSteps.cart++;
          session.steps.push('cart');
          break;
        case 'profile_step':
          funnelSteps.profile++;
          session.steps.push('profile');
          if (session.steps.includes('cart')) {
            stepTimes.profile.push((eventTime - sessionStart) / 1000);
          }
          break;
        case 'shipping_step':
          funnelSteps.shipping++;
          session.steps.push('shipping');
          if (session.steps.includes('profile')) {
            stepTimes.shipping.push((eventTime - sessionStart) / 1000);
          }
          break;
        case 'payment_step':
          funnelSteps.payment++;
          session.steps.push('payment');
          if (session.steps.includes('shipping')) {
            stepTimes.payment.push((eventTime - sessionStart) / 1000);
          }
          break;
        case 'checkout_complete':
          funnelSteps.confirmed++;
          session.steps.push('confirmed');
          break;
      }
    });

    // Calculate average times
    const avgTimes = {
      cart: stepTimes.cart.length > 0
        ? stepTimes.cart.reduce((a, b) => a + b, 0) / stepTimes.cart.length
        : 0,
      profile: stepTimes.profile.length > 0
        ? stepTimes.profile.reduce((a, b) => a + b, 0) / stepTimes.profile.length
        : 0,
      shipping: stepTimes.shipping.length > 0
        ? stepTimes.shipping.reduce((a, b) => a + b, 0) / stepTimes.shipping.length
        : 0,
      payment: stepTimes.payment.length > 0
        ? stepTimes.payment.reduce((a, b) => a + b, 0) / stepTimes.payment.length
        : 0,
    };

    // Calculate conversion rate and abandonment
    const totalSessions = funnelSteps.cart || 1;
    const conversionRate = (funnelSteps.confirmed / totalSessions) * 100;
    const abandonmentRate = 100 - conversionRate;
    const avgCheckoutTime = Object.values(avgTimes).reduce((a, b) => a + b, 0);

    // Calculate abandonment by step
    const stepAbandonment = {
      cart: totalSessions > 0 ? ((totalSessions - funnelSteps.profile) / totalSessions) * 100 : 0,
      profile: funnelSteps.profile > 0 ? ((funnelSteps.profile - funnelSteps.shipping) / funnelSteps.profile) * 100 : 0,
      shipping: funnelSteps.shipping > 0 ? ((funnelSteps.shipping - funnelSteps.payment) / funnelSteps.shipping) * 100 : 0,
      payment: funnelSteps.payment > 0 ? ((funnelSteps.payment - funnelSteps.confirmed) / funnelSteps.payment) * 100 : 0,
    };

    // Format funnel data for chart
    const funnelData = [
      {
        step: 'cart',
        label: 'Cart',
        count: funnelSteps.cart,
        percentage: 100,
      },
      {
        step: 'profile',
        label: 'Profile',
        count: funnelSteps.profile,
        percentage: funnelSteps.cart > 0 ? (funnelSteps.profile / funnelSteps.cart) * 100 : 0,
      },
      {
        step: 'shipping',
        label: 'Shipping',
        count: funnelSteps.shipping,
        percentage: funnelSteps.cart > 0 ? (funnelSteps.shipping / funnelSteps.cart) * 100 : 0,
      },
      {
        step: 'payment',
        label: 'Payment',
        count: funnelSteps.payment,
        percentage: funnelSteps.cart > 0 ? (funnelSteps.payment / funnelSteps.cart) * 100 : 0,
      },
      {
        step: 'confirmed',
        label: 'Confirmed',
        count: funnelSteps.confirmed,
        percentage: conversionRate,
      },
    ];

    // Step performance details
    const stepMetrics = [
      {
        step: 'cart',
        label: 'Cart',
        avgTime: Math.round(avgTimes.cart),
        abandonment: stepAbandonment.cart,
      },
      {
        step: 'profile',
        label: 'Profile',
        avgTime: Math.round(avgTimes.profile),
        abandonment: stepAbandonment.profile,
      },
      {
        step: 'shipping',
        label: 'Shipping',
        avgTime: Math.round(avgTimes.shipping),
        abandonment: stepAbandonment.shipping,
      },
      {
        step: 'payment',
        label: 'Payment',
        avgTime: Math.round(avgTimes.payment),
        abandonment: stepAbandonment.payment,
      },
    ];

    return apiSuccess({
      metrics: {
        conversionRate: conversionRate.toFixed(1),
        abandonmentRate: abandonmentRate.toFixed(1),
        avgCheckoutTime: Math.round(avgCheckoutTime),
        totalSessions,
      },
      funnel: funnelData,
      stepMetrics,
      period,
      dateRange: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

