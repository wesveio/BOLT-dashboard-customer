import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, getPreviousDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';
import { shouldUseDemoData } from '@/lib/automation/demo-mode';
import { getMockDataFromRequest } from '@/lib/mock-data/mock-data-service';

export const dynamic = 'force-dynamic';

/**
 * Extract revenue from event metadata with multiple fallbacks
 * Tries different field names and validates the value
 */
function extractRevenue(event: AnalyticsEvent): number {
  const metadata = event.metadata || {};

  // Try different revenue field names
  const revenueValue =
    metadata.revenue ??
    metadata.value ??
    metadata.orderValue ??
    metadata.totalValue ??
    metadata.amount ??
    null;

  if (revenueValue === null || revenueValue === undefined) {
    return 0;
  }

  // Convert to number
  const numValue = typeof revenueValue === 'number'
    ? revenueValue
    : parseFloat(String(revenueValue));

  // Validate and return
  if (isNaN(numValue) || numValue < 0) {
    return 0;
  }

  return numValue;
}

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

    // Check if account is in demo mode
    const isDemo = await shouldUseDemoData(user.account_id);
    if (isDemo) {
      console.info('✅ [DEBUG] Account in demo mode, returning mock revenue data');
      const mockData = await getMockDataFromRequest('revenue', user.account_id, _request);
      return apiSuccess(mockData);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get revenue data from analytics.events
    const { searchParams } = new URL(_request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Parse custom date range if period is custom
    let customStartDate: Date | null = null;
    let customEndDate: Date | null = null;

    if (period === 'custom') {
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');
      
      if (startDateParam && endDateParam) {
        customStartDate = new Date(startDateParam);
        customEndDate = new Date(endDateParam);
        
        // Validate dates
        if (isNaN(customStartDate.getTime()) || isNaN(customEndDate.getTime())) {
          return apiError('Invalid date format. Use ISO 8601 format.', 400);
        }
      }
    }

    // Calculate date range
    const range = getDateRange(period, customStartDate, customEndDate);

    // Query completed checkout events using RPC function (required for custom schema)
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('❌ [DEBUG] Get revenue analytics error:', eventsError);
      return apiError('Failed to fetch revenue analytics', 500);
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('‼️ [DEBUG] Revenue Analytics Query:', {
        customerId: user.account_id,
        period,
        dateRange: {
          start: range.start.toISOString(),
          end: range.end.toISOString(),
        },
        eventsCount: events?.length || 0,
        eventsFound: !!events,
      });
    }

    // Aggregate revenue data
    let totalRevenue = 0;
    let totalOrders = 0;
    const revenueByDate: Record<string, number> = {};
    // Initialize revenue by hour (0-23) with zeros
    const revenueByHour: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      revenueByHour[i] = 0;
    }
    // Revenue by day - will be populated based on period
    const revenueByDay: Record<string, number> = {};
    const eventsWithRevenue: Array<{ eventId: string; revenue: number; metadata: any }> = [];
    const eventsWithoutRevenue: Array<{ eventId: string; metadata: any }> = [];

    events?.forEach((event: AnalyticsEvent) => {
      const revenue = extractRevenue(event);

      // Debug logging for each event
      if (process.env.NODE_ENV === 'development') {
        if (revenue > 0) {
          eventsWithRevenue.push({
            eventId: event.id,
            revenue,
            metadata: event.metadata,
          });
        } else {
          eventsWithoutRevenue.push({
            eventId: event.id,
            metadata: event.metadata,
          });
        }
      }

      // Only count orders with valid revenue > 0
      if (revenue > 0) {
        totalRevenue += revenue;
        totalOrders++;

        const eventDate = new Date(event.timestamp);

        // Group by date for main chart
        const date = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
        revenueByDate[date] = (revenueByDate[date] || 0) + revenue;

        // Group by hour (0-23)
        const hour = eventDate.getHours();
        revenueByHour[hour] = (revenueByHour[hour] || 0) + revenue;

        // Group by day based on period
        let dayKey: string;
        if (period === 'week') {
          // Day of week (Mon-Sun)
          dayKey = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (period === 'month') {
          // Day of month (1-31)
          dayKey = eventDate.getDate().toString();
        } else if (period === 'year') {
          // Month name
          dayKey = eventDate.toLocaleDateString('en-US', { month: 'short' });
        } else {
          // For "today", use day of week
          dayKey = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
        }
        revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + revenue;
      }
    });

    // Debug logging summary
    if (process.env.NODE_ENV === 'development') {
      console.warn('‼️ [DEBUG] Revenue Extraction Summary:', {
        totalEvents: events?.length || 0,
        eventsWithRevenue: eventsWithRevenue.length,
        eventsWithoutRevenue: eventsWithoutRevenue.length,
        totalRevenue,
        totalOrders,
        sampleEventsWithRevenue: eventsWithRevenue.slice(0, 3),
        sampleEventsWithoutRevenue: eventsWithoutRevenue.slice(0, 3),
      });
    }

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

    // Format data for line chart - preserve exact values and sort chronologically
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const revenueData = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({
        date,
        revenue, // Preserve exact value, no rounding
      }))
      .sort((a, b) => {
        // Sort by day of week order when period is 'week' or 'today'
        if (period === 'week' || period === 'today') {
          const aIndex = dayOrder.indexOf(a.date);
          const bIndex = dayOrder.indexOf(b.date);
          // If not found in dayOrder, fall back to string comparison
          if (aIndex === -1 && bIndex === -1) return a.date.localeCompare(b.date);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        }
        // For other periods, sort by date string (chronological)
        return a.date.localeCompare(b.date);
      });

    // Format revenue by hour - preserve exact values, ensure all 24 hours are present
    const revenueByHourData = Object.keys(revenueByHour)
      .map(Number)
      .sort((a, b) => a - b)
      .map((hour) => ({
        hour: hour.toString().padStart(2, '0') + ':00',
        revenue: Math.max(0, revenueByHour[hour] || 0), // Ensure non-negative
      }));

    // Format revenue by day - preserve exact values
    let revenueByDayData: Array<{ day: string; revenue: number }> = [];
    if (period === 'week') {
      // Order by day of week
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      revenueByDayData = dayOrder.map((day) => ({
        day,
        revenue: Math.max(0, revenueByDay[day] || 0),
      }));
    } else if (period === 'month') {
      // Order by day of month (1-31)
      revenueByDayData = Object.keys(revenueByDay)
        .map(Number)
        .sort((a, b) => a - b)
        .map((day) => ({
          day: day.toString(),
          revenue: Math.max(0, revenueByDay[day.toString()] || 0),
        }));
    } else if (period === 'year') {
      // Order by month
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      revenueByDayData = monthOrder.map((month) => ({
        day: month,
        revenue: Math.max(0, revenueByDay[month] || 0),
      }));
    } else {
      // For "today", use day of week
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      revenueByDayData = dayOrder.map((day) => ({
        day,
        revenue: Math.max(0, revenueByDay[day] || 0),
      }));
    }

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
      const revenue = extractRevenue(event);
      previousRevenue += revenue;
    });

    // Calculate revenue growth with proper handling of edge cases
    let revenueGrowth = 0;
    if (previousRevenue > 0) {
      // Normal case: calculate percentage change
      revenueGrowth = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
    } else if (previousRevenue === 0 && totalRevenue > 0) {
      // Growth from zero: indicate positive growth (100% represents doubling, so we use 100% for "new revenue")
      revenueGrowth = 100;
    } else {
      // Both are zero: no change
      revenueGrowth = 0;
    }

    return apiSuccess({
      metrics: {
        totalRevenue, // Preserve exact value, no rounding
        avgOrderValue, // Preserve exact value as number
        totalOrders,
        revenuePerHour, // Preserve exact value as number
        revenueGrowth, // Preserve exact value as number
      },
      chartData: revenueData,
      revenueByHour: revenueByHourData,
      revenueByDay: revenueByDayData,
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

