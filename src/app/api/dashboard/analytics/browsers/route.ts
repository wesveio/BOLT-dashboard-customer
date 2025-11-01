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

    // Query browser/platform-related events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('analytics.events')
      .select('*')
      .eq('customer_id', user.account_id)
      .eq('event_type', 'checkout_start')
      .gte('timestamp', range.start.toISOString())
      .lte('timestamp', range.end.toISOString());

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

