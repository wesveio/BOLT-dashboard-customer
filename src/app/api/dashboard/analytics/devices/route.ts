import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

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

    // Query device-related events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('analytics.events')
      .select('*')
      .eq('customer_id', user.account_id)
      .eq('event_type', 'checkout_start')
      .gte('timestamp', range.start.toISOString())
      .lte('timestamp', range.end.toISOString());

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

    events?.forEach((event) => {
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
        devices[device].revenue += parseFloat(event.metadata.revenue);
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

