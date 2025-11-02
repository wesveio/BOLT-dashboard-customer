import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * GET /api/dashboard/revenue
 * Get revenue analytics for the authenticated user's account
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

    // Get revenue data from analytics.events
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

    // Query completed checkout events using RPC function (required for custom schema)
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('Get revenue analytics error:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch revenue analytics' },
        { status: 500 }
      );
    }

    // Aggregate revenue data
    let totalRevenue = 0;
    let totalOrders = 0;
    const revenueByDate: Record<string, number> = {};

    events?.forEach((event) => {
      const revenue = event.metadata?.revenue ? parseFloat(event.metadata.revenue) : 0;
      totalRevenue += revenue;
      totalOrders++;

      // Group by date for chart
      const date = new Date(event.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      revenueByDate[date] = (revenueByDate[date] || 0) + revenue;
    });

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate revenue per hour (for "today" period)
    let revenuePerHour = 0;
    if (period === 'today') {
      const hoursElapsed = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60);
      revenuePerHour = hoursElapsed > 0 ? totalRevenue / hoursElapsed : 0;
    } else {
      const hoursElapsed = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60);
      revenuePerHour = hoursElapsed > 0 ? totalRevenue / hoursElapsed : 0;
    }

    // Format data for line chart
    const revenueData = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue),
    }));

    // Calculate growth (compare with previous period)
    const previousRangeStart = new Date(range.start.getTime() - (range.end.getTime() - range.start.getTime()));
    const previousRangeEnd = range.start;

    const { data: previousEvents } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete'],
        p_start_date: previousRangeStart.toISOString(),
        p_end_date: previousRangeEnd.toISOString(),
      });

    let previousRevenue = 0;
    previousEvents?.forEach((event) => {
      const revenue = event.metadata?.revenue ? parseFloat(event.metadata.revenue) : 0;
      previousRevenue += revenue;
    });

    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return NextResponse.json({
      metrics: {
        totalRevenue: Math.round(totalRevenue),
        avgOrderValue: avgOrderValue.toFixed(2),
        totalOrders,
        revenuePerHour: revenuePerHour.toFixed(2),
        revenueGrowth: revenueGrowth.toFixed(1),
      },
      chartData: revenueData,
      period,
      dateRange: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

