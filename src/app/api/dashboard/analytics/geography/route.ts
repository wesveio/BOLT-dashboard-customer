import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

/**
 * Extract revenue from event metadata with multiple fallbacks
 */
function extractRevenue(event: AnalyticsEvent): number {
  const metadata = event.metadata || {};
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

  const numValue = typeof revenueValue === 'number'
    ? revenueValue
    : parseFloat(String(revenueValue));

  if (isNaN(numValue) || numValue < 0) {
    return 0;
  }

  return numValue;
}

/**
 * GET /api/dashboard/analytics/geography
 * Get geographic analytics for the authenticated user's account
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get geographic data from analytics.events
    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Calculate date range
    const range = getDateRange(period);

    // Query geographic-related events using RPC function
    const { data: geoEvents, error: geoError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['address_validated', 'shipping_option_selected'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (geoError) {
      console.error('Get geographic events error:', geoError);
      return apiError('Failed to fetch geographic events', 500);
    }

    // Query checkout events to get revenue by location
    const { data: checkoutEvents, error: checkoutError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete', 'order_confirmed'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (checkoutError) {
      console.error('Get checkout events error:', checkoutError);
      return apiError('Failed to fetch checkout events', 500);
    }

    // Aggregate by country
    const countries: Record<string, {
      country: string;
      sessions: Set<string>;
      orders: number;
      revenue: number;
      conversions: number;
    }> = {};

    // Aggregate by state/region
    const states: Record<string, {
      country: string;
      state: string;
      sessions: Set<string>;
      orders: number;
      revenue: number;
      conversions: number;
    }> = {};

    // Track sessions by country/state
    geoEvents?.forEach((event: AnalyticsEvent) => {
      const metadata = event.metadata || {};
      const country = (metadata.country as string) || 'Unknown';
      const state = (metadata.state as string) || 'Unknown';
      const sessionId = event.session_id;

      // Country aggregation
      if (!countries[country]) {
        countries[country] = {
          country,
          sessions: new Set(),
          orders: 0,
          revenue: 0,
          conversions: 0,
        };
      }
      countries[country].sessions.add(sessionId);

      // State aggregation (only if state is available)
      if (state && state !== 'Unknown') {
        const stateKey = `${country}:${state}`;
        if (!states[stateKey]) {
          states[stateKey] = {
            country,
            state,
            sessions: new Set(),
            orders: 0,
            revenue: 0,
            conversions: 0,
          };
        }
        states[stateKey].sessions.add(sessionId);
      }
    });

    // Match checkout events with geographic data
    checkoutEvents?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      const revenue = extractRevenue(event);

      // Find geographic data for this session
      const sessionGeoEvent = geoEvents?.find(
        (e: AnalyticsEvent) => e.session_id === sessionId
      );

      if (sessionGeoEvent && revenue > 0) {
        const metadata = sessionGeoEvent.metadata || {};
        const country = (metadata.country as string) || 'Unknown';
        const state = (metadata.state as string) || 'Unknown';

        // Update country stats
        if (countries[country]) {
          countries[country].orders++;
          countries[country].revenue += revenue;
          countries[country].conversions++;
        }

        // Update state stats
        if (state && state !== 'Unknown') {
          const stateKey = `${country}:${state}`;
          if (states[stateKey]) {
            states[stateKey].orders++;
            states[stateKey].revenue += revenue;
            states[stateKey].conversions++;
          }
        }
      }
    });

    // Convert to arrays and calculate metrics
    const countryData = Object.values(countries)
      .map((country) => {
        const sessionCount = country.sessions.size;
        const conversionRate = sessionCount > 0
          ? (country.conversions / sessionCount) * 100
          : 0;
        const avgOrderValue = country.orders > 0
          ? country.revenue / country.orders
          : 0;

        return {
          country: country.country,
          sessions: sessionCount,
          orders: country.orders,
          revenue: country.revenue,
          conversions: country.conversions,
          conversionRate,
          avgOrderValue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const stateData = Object.values(states)
      .map((state) => {
        const sessionCount = state.sessions.size;
        const conversionRate = sessionCount > 0
          ? (state.conversions / sessionCount) * 100
          : 0;
        const avgOrderValue = state.orders > 0
          ? state.revenue / state.orders
          : 0;

        return {
          country: state.country,
          state: state.state,
          sessions: sessionCount,
          orders: state.orders,
          revenue: state.revenue,
          conversions: state.conversions,
          conversionRate,
          avgOrderValue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate totals
    const totalSessions = Object.values(countries).reduce(
      (sum, country) => sum + country.sessions.size,
      0
    );
    const totalOrders = countryData.reduce((sum, country) => sum + country.orders, 0);
    const totalRevenue = countryData.reduce((sum, country) => sum + country.revenue, 0);
    const overallConversionRate = totalSessions > 0
      ? (countryData.reduce((sum, country) => sum + country.conversions, 0) / totalSessions) * 100
      : 0;

    return apiSuccess({
      countries: countryData,
      states: stateData,
      summary: {
        totalSessions,
        totalOrders,
        totalRevenue,
        overallConversionRate,
        countriesCount: countryData.length,
        statesCount: stateData.length,
      },
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

