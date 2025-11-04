import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

/**
 * GET /api/dashboard/metrics
 * Get aggregated metrics for the authenticated user's account
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
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

    const { searchParams } = new URL(_request.url);
    const period = searchParams.get('period') || 'week';

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

    // Get metrics from analytics.events table using RPC function (required for custom schema)
    const { data: metrics, error: metricsError } = await supabaseAdmin
      .rpc('get_analytics_events', {
        p_customer_id: user.account_id,
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (metricsError) {
      console.error('Get metrics error:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    // Helper function to clamp percentage between 0 and 100
    const clampPercentage = (value: number): number => {
      return Math.max(0, Math.min(100, value));
    };

    // Aggregate metrics
    const aggregated = {
      totalSessions: metrics?.filter((e: AnalyticsEvent) => e.event_type === 'checkout_start').length || 0,
      totalConversions: metrics?.filter((e: AnalyticsEvent) => e.event_type === 'checkout_complete').length || 0,
      totalRevenue: metrics?.reduce((sum: number, e: AnalyticsEvent) => {
        if (e.metadata?.revenue) {
          return sum + parseFloat(String(e.metadata.revenue));
        }
        return sum;
      }, 0) || 0,
      totalOrders: metrics?.filter((e: AnalyticsEvent) => e.event_type === 'checkout_complete').length || 0,
      avgOrderValue: 0,
      conversionRate: 0,
      abandonmentRate: 0,
    };

    if (aggregated.totalSessions > 0) {
      aggregated.conversionRate = clampPercentage((aggregated.totalConversions / aggregated.totalSessions) * 100);
      aggregated.abandonmentRate = clampPercentage(100 - aggregated.conversionRate);
    }

    if (aggregated.totalOrders > 0) {
      aggregated.avgOrderValue = aggregated.totalRevenue / aggregated.totalOrders;
    }

    // Calculate funnel metrics
    const funnelSteps = {
      cart: metrics?.filter((e: AnalyticsEvent) => e.event_type === 'cart_view').length || 0,
      profile: metrics?.filter((e: AnalyticsEvent) => e.event_type === 'profile_step').length || 0,
      shipping: metrics?.filter((e: AnalyticsEvent) => e.event_type === 'shipping_step').length || 0,
      payment: metrics?.filter((e: AnalyticsEvent) => e.event_type === 'payment_step').length || 0,
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

