import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * GET /api/dashboard/metrics
 * Get aggregated metrics for the authenticated user's account
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // today, week, month, year

    // Calculate date range based on period
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

    // Get metrics from analytics.events table
    // Using materialized views if available, otherwise query directly
    const { data: metrics, error: metricsError } = await supabaseAdmin
      .from('analytics.events')
      .select('*')
      .eq('account_id', user.account_id)
      .gte('created_at', range.start.toISOString())
      .lte('created_at', range.end.toISOString());

    if (metricsError) {
      console.error('Get metrics error:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    // Aggregate metrics
    const aggregated = {
      totalSessions: metrics?.filter((e) => e.category === 'checkout_start').length || 0,
      totalConversions: metrics?.filter((e) => e.category === 'checkout_complete').length || 0,
      totalRevenue: metrics?.reduce((sum, e) => {
        if (e.metadata?.revenue) {
          return sum + parseFloat(e.metadata.revenue);
        }
        return sum;
      }, 0) || 0,
      totalOrders: metrics?.filter((e) => e.category === 'checkout_complete').length || 0,
      avgOrderValue: 0,
      conversionRate: 0,
      abandonmentRate: 0,
    };

    if (aggregated.totalSessions > 0) {
      aggregated.conversionRate = (aggregated.totalConversions / aggregated.totalSessions) * 100;
      aggregated.abandonmentRate = 100 - aggregated.conversionRate;
    }

    if (aggregated.totalOrders > 0) {
      aggregated.avgOrderValue = aggregated.totalRevenue / aggregated.totalOrders;
    }

    // Calculate funnel metrics
    const funnelSteps = {
      cart: metrics?.filter((e) => e.event_type === 'cart_view').length || 0,
      profile: metrics?.filter((e) => e.event_type === 'profile_step').length || 0,
      shipping: metrics?.filter((e) => e.event_type === 'shipping_step').length || 0,
      payment: metrics?.filter((e) => e.event_type === 'payment_step').length || 0,
      confirmed: aggregated.totalConversions,
    };

    return NextResponse.json({
      metrics: aggregated,
      funnel: funnelSteps,
      period,
      dateRange: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

