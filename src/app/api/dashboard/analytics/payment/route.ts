import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * GET /api/dashboard/analytics/payment
 * Get payment method analytics for the authenticated user's account
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get payment method data from analytics.events
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

    // Query payment-related events using RPC function (required for custom schema)
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['payment_method_selected', 'payment_completed', 'payment_failed'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('Get payment analytics error:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch payment analytics' },
        { status: 500 }
      );
    }

    // Aggregate payment methods
    const paymentMethods: Record<string, {
      name: string;
      count: number;
      revenue: number;
      successCount: number;
      failedCount: number;
    }> = {};

    events?.forEach((event) => {
      const method = event.metadata?.paymentMethod as string || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          name: method,
          count: 0,
          revenue: 0,
          successCount: 0,
          failedCount: 0,
        };
      }

      paymentMethods[method].count++;

      if (event.event_type === 'payment_completed') {
        paymentMethods[method].successCount++;
        if (event.metadata?.revenue) {
          paymentMethods[method].revenue += parseFloat(event.metadata.revenue);
        }
      } else if (event.event_type === 'payment_failed') {
        paymentMethods[method].failedCount++;
      }
    });

    // Convert to array and calculate success rates
    const paymentData = Object.values(paymentMethods).map((method) => ({
      name: method.name,
      value: method.count,
      revenue: method.revenue,
      successRate: method.count > 0
        ? (method.successCount / method.count) * 100
        : 0,
    }));

    const totalPayments = paymentData.reduce((sum, item) => sum + item.value, 0);
    const avgSuccessRate = paymentData.length > 0
      ? paymentData.reduce((sum, item) => sum + item.successRate, 0) / paymentData.length
      : 0;

    return NextResponse.json({
      paymentMethods: paymentData,
      totalPayments,
      avgSuccessRate: avgSuccessRate.toFixed(1),
      period,
    });
  } catch (error) {
    console.error('Get payment analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

