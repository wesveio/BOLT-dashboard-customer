import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * GET /api/dashboard/performance
 * Get detailed performance metrics for the authenticated user's account
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Find session using RPC function (required for custom schema)
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .rpc('get_session_by_token', { p_token: sessionToken });

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (sessionError || !session) {
      console.error('🚨 [DEBUG] Session error:', sessionError);
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Validate session expiration (RPC already filters expired, but double-check)
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get user to find their account_id using RPC function (required for custom schema)
    const { data: users, error: userError } = await supabaseAdmin
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user) {
      console.error('🚨 [DEBUG] User query error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get performance data from analytics.events
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Calculate date range
    const now = new Date();
    const dateRanges: Record<string, { start: Date; end: Date }> = {
      today: {
        start: new Date(now.setHours(0, 0, 0, 0)),
        end: new Date(),
      },
      week: {
        start: new Date(now.setDate(now.getDate() - 7)),
        end: new Date(),
      },
      month: {
        start: new Date(now.setMonth(now.getMonth() - 1)),
        end: new Date(),
      },
      year: {
        start: new Date(now.setFullYear(now.getFullYear() - 1)),
        end: new Date(),
      },
    };

    const range = dateRanges[period] || dateRanges.week;

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
      return NextResponse.json(
        { error: 'Failed to fetch performance metrics' },
        { status: 500 }
      );
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

    return NextResponse.json({
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
    console.error('Get performance metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

