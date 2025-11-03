import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, getPreviousDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

/**
 * GET /api/dashboard/revenue
 * Get revenue analytics for the authenticated user's account
 */
export async function GET(_request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get revenue data from analytics.events
    const { searchParams } = new URL(_request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Calculate date range
    const range = getDateRange(period);

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
      return apiError('Failed to fetch revenue analytics', 500);
    }

    // Aggregate revenue data
    let totalRevenue = 0;
    let totalOrders = 0;
    const revenueByDate: Record<string, number> = {};

    events?.forEach((event: AnalyticsEvent) => {
      const revenue = event.metadata?.revenue ? parseFloat(String(event.metadata?.revenue as string)) : 0;
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
    const previousRange = getPreviousDateRange(range);

    const { data: previousEvents } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete'],
        p_start_date: previousRange.start.toISOString(),
        p_end_date: previousRange.end.toISOString(),
      });

    let previousRevenue = 0;
    previousEvents?.forEach((event: AnalyticsEvent) => {
      const revenue = event.metadata?.revenue ? parseFloat(String(event.metadata?.revenue as string)) : 0;
      previousRevenue += revenue;
    });

    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return apiSuccess({
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
    return apiInternalError(error);
  }
}

