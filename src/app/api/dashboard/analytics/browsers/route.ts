import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * GET /api/dashboard/analytics/browsers
 * Get browser and platform analytics for the authenticated user's account
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

    // Get browser/platform data from analytics.events
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

    // Query browser/platform-related events using RPC function (required for custom schema)
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_start'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('Get browser analytics error:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch browser analytics' },
        { status: 500 }
      );
    }

    // Aggregate by browser
    const browsers: Record<string, {
      browser: string;
      sessions: number;
      conversions: number;
      revenue: number;
    }> = {};

    // Aggregate by platform
    const platforms: Record<string, {
      platform: string;
      sessions: number;
      conversions: number;
      revenue: number;
    }> = {};

    events?.forEach((event) => {
      // Browser data
      const browser = event.metadata?.browser as string || 'Unknown';
      if (!browsers[browser]) {
        browsers[browser] = {
          browser,
          sessions: 0,
          conversions: 0,
          revenue: 0,
        };
      }
      browsers[browser].sessions++;
      if (event.metadata?.converted) {
        browsers[browser].conversions++;
      }
      if (event.metadata?.revenue) {
        browsers[browser].revenue += parseFloat(event.metadata.revenue);
      }

      // Platform data
      const platform = event.metadata?.platform as string || 'Unknown';
      if (!platforms[platform]) {
        platforms[platform] = {
          platform,
          sessions: 0,
          conversions: 0,
          revenue: 0,
        };
      }
      platforms[platform].sessions++;
      if (event.metadata?.converted) {
        platforms[platform].conversions++;
      }
      if (event.metadata?.revenue) {
        platforms[platform].revenue += parseFloat(event.metadata.revenue);
      }
    });

    // Convert to arrays and calculate metrics
    const browserData = Object.values(browsers).map((browser) => {
      const totalSessions = Object.values(browsers).reduce((sum, b) => sum + b.sessions, 0);
      return {
        browser: browser.browser,
        sessions: browser.sessions,
        conversion: browser.sessions > 0
          ? (browser.conversions / browser.sessions) * 100
          : 0,
        revenue: browser.revenue,
        marketShare: totalSessions > 0
          ? (browser.sessions / totalSessions) * 100
          : 0,
      };
    });

    const platformData = Object.values(platforms).map((platform) => ({
      platform: platform.platform,
      sessions: platform.sessions,
      conversion: platform.sessions > 0
        ? (platform.conversions / platform.sessions) * 100
        : 0,
      revenue: platform.revenue,
    }));

    const totalSessions = browserData.reduce((sum, item) => sum + item.sessions, 0);
    const avgConversion = browserData.length > 0
      ? browserData.reduce((sum, item) => sum + item.conversion, 0) / browserData.length
      : 0;

    return NextResponse.json({
      browsers: browserData,
      platforms: platformData,
      totalSessions,
      avgConversion: avgConversion.toFixed(1),
      period,
    });
  } catch (error) {
    console.error('Get browser analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

