import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';
import { extractRevenue } from '@/utils/analytics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/analytics/devices
 * Get device analytics for the authenticated user's account
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get device data from analytics.events
    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Calculate date range
    const range = getDateRange(period);

    // Query device-related events using RPC function (required for custom schema)
    // Get both checkout_start and checkout_complete events
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_start', 'checkout_complete'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('Get device analytics error:', eventsError);
      return apiError('Failed to fetch device analytics', 500);
    }

    // Separate events by type
    const checkoutStartEvents: AnalyticsEvent[] = [];
    const checkoutCompleteEvents: AnalyticsEvent[] = [];

    events?.forEach((event: AnalyticsEvent) => {
      if (event.event_type === 'checkout_start') {
        checkoutStartEvents.push(event);
      } else if (event.event_type === 'checkout_complete') {
        checkoutCompleteEvents.push(event);
      }
    });

    // Create maps for conversions and revenue by session_id
    const convertedSessions = new Set<string>();
    const revenueBySession = new Map<string, number>();

    checkoutCompleteEvents.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      if (sessionId) {
        convertedSessions.add(sessionId);
        const revenue = extractRevenue(event);
        if (revenue > 0) {
          revenueBySession.set(sessionId, revenue);
        }
      }
    });

    // Aggregate by device type from checkout_start events
    const devices: Record<string, {
      device: string;
      sessions: number;
      conversions: number;
      revenue: number;
    }> = {};

    checkoutStartEvents.forEach((event: AnalyticsEvent) => {
      const device = event.metadata?.deviceType as string || 'Unknown';
      const sessionId = event.session_id;

      if (!devices[device]) {
        devices[device] = {
          device,
          sessions: 0,
          conversions: 0,
          revenue: 0,
        };
      }

      devices[device].sessions++;

      // Check if this session converted (has checkout_complete event)
      if (sessionId && convertedSessions.has(sessionId)) {
        devices[device].conversions++;
      }

      // Get revenue from checkout_complete event
      if (sessionId && revenueBySession.has(sessionId)) {
        const revenue = revenueBySession.get(sessionId) || 0;
        devices[device].revenue += revenue;
      }
    });

    // Convert to array and calculate conversion rates
    const deviceData = Object.values(devices).map((device) => ({
      device: device.device,
      sessions: device.sessions,
      conversion: device.sessions > 0
        ? (device.conversions / device.sessions) * 100
        : 0,
      revenue: device.revenue,
    }));

    const totalSessions = deviceData.reduce((sum, item) => sum + item.sessions, 0);
    const avgConversion = deviceData.length > 0
      ? deviceData.reduce((sum, item) => sum + item.conversion, 0) / deviceData.length
      : 0;

    return apiSuccess({
      devices: deviceData,
      totalSessions,
      avgConversion: avgConversion.toFixed(1),
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

