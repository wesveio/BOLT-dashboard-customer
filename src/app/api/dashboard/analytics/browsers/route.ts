import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';
import { extractRevenue } from '@/utils/analytics';
import { checkDemoModeAndReturnMockSuccess } from '@/lib/api/demo-mode-check';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/analytics/browsers
 * Get browser and platform analytics for the authenticated user's account
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    // Check demo mode
    const mockResponse = await checkDemoModeAndReturnMockSuccess('analytics-browsers', user.account_id, request);
    if (mockResponse) return mockResponse;

    const supabaseAdmin = getSupabaseAdmin();

    // Get browser/platform data from analytics.events
    const { searchParams } = new URL(request.url);
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

    // Query browser/platform-related events using RPC function (required for custom schema)
    // Get both checkout_start and checkout_complete events
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_start', 'checkout_complete'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('Get browser analytics error:', eventsError);
      return apiError('Failed to fetch browser analytics', 500);
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

    checkoutStartEvents.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;

      // Browser data
      const browser = event.metadata?.browserName as string || event.metadata?.browser as string || 'Unknown';
      if (!browsers[browser]) {
        browsers[browser] = {
          browser,
          sessions: 0,
          conversions: 0,
          revenue: 0,
        };
      }
      browsers[browser].sessions++;

      // Check if this session converted (has checkout_complete event)
      if (sessionId && convertedSessions.has(sessionId)) {
        browsers[browser].conversions++;
      }

      // Get revenue from checkout_complete event
      if (sessionId && revenueBySession.has(sessionId)) {
        const revenue = revenueBySession.get(sessionId) || 0;
        browsers[browser].revenue += revenue;
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

      // Check if this session converted (has checkout_complete event)
      if (sessionId && convertedSessions.has(sessionId)) {
        platforms[platform].conversions++;
      }

      // Get revenue from checkout_complete event
      if (sessionId && revenueBySession.has(sessionId)) {
        const revenue = revenueBySession.get(sessionId) || 0;
        platforms[platform].revenue += revenue;
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

    return apiSuccess({
      browsers: browserData,
      platforms: platformData,
      totalSessions,
      avgConversion: avgConversion.toFixed(1),
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

