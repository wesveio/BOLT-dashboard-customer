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

    // Find session and user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('dashboard.sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get user to find their account_id
    const { data: user, error: userError } = await supabaseAdmin
      .from('dashboard.users')
      .select('account_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
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

    // Query completed checkout events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('analytics.events')
      .select('*')
      .eq('customer_id', user.account_id)
      .eq('event_type', 'checkout_complete')
      .gte('timestamp', range.start.toISOString())
      .lte('timestamp', range.end.toISOString())
      .order('timestamp', { ascending: true });

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
      .from('analytics.events')
      .select('*')
      .eq('customer_id', user.account_id)
      .eq('event_type', 'checkout_complete')
      .gte('timestamp', previousRangeStart.toISOString())
      .lte('timestamp', previousRangeEnd.toISOString());

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

