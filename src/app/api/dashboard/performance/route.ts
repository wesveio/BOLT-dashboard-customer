import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

/**
 * GET /api/dashboard/performance
 * Get detailed performance metrics for the authenticated user's account
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get performance data from analytics.events
    const { searchParams } = new URL(_request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Calculate date range
    const range = getDateRange(period);

    // Query all checkout events using RPC function (required for custom schema)
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: [
          'checkout_start',
          'checkout_started',
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

    // Track sessions that started checkout (consistent with other APIs)
    const sessionsWithCheckoutStart = new Set<string>();

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

    events?.forEach((event: AnalyticsEvent) => {
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
        case 'checkout_start':
        case 'checkout_started':
          // Track sessions that started checkout (consistent with metrics and insights APIs)
          sessionsWithCheckoutStart.add(sessionId);
          // Count as cart view in funnel if not already counted for this session
          if (!session.steps.includes('cart')) {
            funnelSteps.cart++;
            session.steps.push('cart');
          }
          break;
        case 'cart_view':
          // Count as cart view in funnel if not already counted for this session
          if (!session.steps.includes('cart')) {
            funnelSteps.cart++;
            session.steps.push('cart');
          }
          break;
        case 'profile_step':
          funnelSteps.profile++;
          session.steps.push('profile');
          if (session.steps.includes('cart')) {
            const timeDiff = (eventTime - sessionStart) / 1000;
            // Only add positive time differences
            if (timeDiff >= 0) {
              stepTimes.profile.push(timeDiff);
            }
          }
          break;
        case 'shipping_step':
          funnelSteps.shipping++;
          session.steps.push('shipping');
          if (session.steps.includes('profile')) {
            const timeDiff = (eventTime - sessionStart) / 1000;
            // Only add positive time differences
            if (timeDiff >= 0) {
              stepTimes.shipping.push(timeDiff);
            }
          }
          break;
        case 'payment_step':
          funnelSteps.payment++;
          session.steps.push('payment');
          if (session.steps.includes('shipping')) {
            const timeDiff = (eventTime - sessionStart) / 1000;
            // Only add positive time differences
            if (timeDiff >= 0) {
              stepTimes.payment.push(timeDiff);
            }
          }
          break;
        case 'checkout_complete':
          funnelSteps.confirmed++;
          session.steps.push('confirmed');
          break;
      }
    });

    // Calculate average times, filtering out negative values and ensuring non-negative results
    const calculateAvgTime = (times: number[]): number => {
      const validTimes = times.filter(t => t >= 0);
      if (validTimes.length === 0) return 0;
      return Math.max(0, validTimes.reduce((a, b) => a + b, 0) / validTimes.length);
    };

    const avgTimes = {
      cart: calculateAvgTime(stepTimes.cart),
      profile: calculateAvgTime(stepTimes.profile),
      shipping: calculateAvgTime(stepTimes.shipping),
      payment: calculateAvgTime(stepTimes.payment),
    };

    // Helper functions for percentage calculations
    const clampPercentage = (value: number): number => {
      return Math.max(0, Math.min(100, value));
    };

    const roundPercentage = (value: number): number => {
      return Math.round(value * 10) / 10;
    };

    // Calculate conversion rate and abandonment
    // Use checkout_start count for total sessions (consistent with metrics and insights APIs)
    // Count unique sessions that had checkout_start events
    const totalSessionsCount = sessionsWithCheckoutStart.size;
    // Fallback to cart views if no checkout_start events found (for backward compatibility)
    const totalSessions = totalSessionsCount > 0 ? totalSessionsCount : (funnelSteps.cart || 0);
    const conversionRate = totalSessions > 0 
      ? clampPercentage((funnelSteps.confirmed / totalSessions) * 100)
      : 0;
    const abandonmentRate = clampPercentage(100 - conversionRate);
    // Ensure average checkout time is never negative
    const avgCheckoutTime = Math.max(0, Object.values(avgTimes).reduce((a, b) => a + b, 0));

    // Calculate abandonment by step (clamped to 0-100% and rounded)
    const stepAbandonment = {
      cart: totalSessions > 0
        ? roundPercentage(clampPercentage(((totalSessions - funnelSteps.profile) / totalSessions) * 100))
        : 0,
      profile: funnelSteps.profile > 0
        ? roundPercentage(clampPercentage(((funnelSteps.profile - funnelSteps.shipping) / funnelSteps.profile) * 100))
        : 0,
      shipping: funnelSteps.shipping > 0
        ? roundPercentage(clampPercentage(((funnelSteps.shipping - funnelSteps.payment) / funnelSteps.shipping) * 100))
        : 0,
      payment: funnelSteps.payment > 0
        ? roundPercentage(clampPercentage(((funnelSteps.payment - funnelSteps.confirmed) / funnelSteps.payment) * 100))
        : 0,
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

    // Step performance details - ensure all times are non-negative
    const stepMetrics = [
      {
        step: 'cart',
        label: 'Cart',
        avgTime: Math.max(0, Math.round(avgTimes.cart)),
        abandonment: stepAbandonment.cart,
      },
      {
        step: 'profile',
        label: 'Profile',
        avgTime: Math.max(0, Math.round(avgTimes.profile)),
        abandonment: stepAbandonment.profile,
      },
      {
        step: 'shipping',
        label: 'Shipping',
        avgTime: Math.max(0, Math.round(avgTimes.shipping)),
        abandonment: stepAbandonment.shipping,
      },
      {
        step: 'payment',
        label: 'Payment',
        avgTime: Math.max(0, Math.round(avgTimes.payment)),
        abandonment: stepAbandonment.payment,
      },
    ];

    return apiSuccess({
      metrics: {
        conversionRate: conversionRate.toFixed(1),
        abandonmentRate: abandonmentRate.toFixed(1),
        // Ensure avgCheckoutTime is never negative
        avgCheckoutTime: Math.max(0, Math.round(avgCheckoutTime)),
        totalSessions: Math.max(0, totalSessions),
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

