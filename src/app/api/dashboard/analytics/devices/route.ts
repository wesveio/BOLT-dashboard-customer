import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

/**
 * GET /api/dashboard/analytics/devices
 * Get device analytics for the authenticated user's account
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

    // Get device data from analytics.events
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

    // Query device-related events using RPC function (required for custom schema)
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_start'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('Get device analytics error:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch device analytics' },
        { status: 500 }
      );
    }

    // Aggregate by device type
    const devices: Record<string, {
      device: string;
      sessions: number;
      conversions: number;
      revenue: number;
    }> = {};

    events?.forEach((event: AnalyticsEvent) => {
      const device = event.metadata?.deviceType as string || 'Unknown';
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
      if (event.metadata?.converted) {
        devices[device].conversions++;
      }

      if (event.metadata?.revenue) {
        devices[device].revenue += parseFloat(String(event.metadata.revenue));
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

    return NextResponse.json({
      devices: deviceData,
      totalSessions,
      avgConversion: avgConversion.toFixed(1),
      period,
    });
  } catch (error) {
    console.error('Get device analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

