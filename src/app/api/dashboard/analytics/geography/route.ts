import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';
import { checkDemoModeAndReturnMockSuccess } from '@/lib/api/demo-mode-check';

export const dynamic = 'force-dynamic';

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

    // Check demo mode
    const mockResponse = await checkDemoModeAndReturnMockSuccess('analytics-geography', user.account_id, request);
    if (mockResponse) return mockResponse;

    const supabaseAdmin = getSupabaseAdmin();

    // Get geographic data from analytics.events
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

    console.info('✅ [DEBUG] Geography - Date range:', {
      period,
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    });

    // Query geographic-related events using RPC function
    // Also include checkout_start to track all sessions
    const { data: geoEvents, error: geoError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['address_validated', 'shipping_option_selected', 'checkout_start', 'checkout_started'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (geoError) {
      console.error('❌ [DEBUG] Get geographic events error:', geoError);
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
      console.error('❌ [DEBUG] Get checkout events error:', checkoutError);
      return apiError('Failed to fetch checkout events', 500);
    }

    console.info('✅ [DEBUG] Geography - Events found:', {
      geoEvents: geoEvents?.length || 0,
      checkoutEvents: checkoutEvents?.length || 0,
    });

    // Aggregate by country
    const countries: Record<string, {
      country: string;
      sessions: Set<string>;
      orders: number;
      revenue: number;
      convertingSessions: Set<string>; // Unique sessions that converted
    }> = {};

    // Aggregate by state/region
    const states: Record<string, {
      country: string;
      state: string;
      sessions: Set<string>;
      orders: number;
      revenue: number;
      convertingSessions: Set<string>; // Unique sessions that converted
    }> = {};

    // Track sessions by country/state from geo events
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
          convertingSessions: new Set(),
        };
      }
      countries[country].sessions.add(sessionId);

      // State aggregation (only if state is available and not 'Unknown')
      if (state && state !== 'Unknown' && state.trim() !== '') {
        const stateKey = `${country}:${state}`;
        if (!states[stateKey]) {
          states[stateKey] = {
            country,
            state,
            sessions: new Set(),
            orders: 0,
            revenue: 0,
            convertingSessions: new Set(),
          };
        }
        states[stateKey].sessions.add(sessionId);
      }
    });

    console.info('✅ [DEBUG] Geography - Initial geo events processing:', {
      geoEventsProcessed: geoEvents?.length || 0,
      countriesFound: Object.keys(countries).length,
      statesFound: Object.keys(states).length,
      statesList: Object.keys(states).map(key => {
        const state = states[key];
        return `${state.country}:${state.state} (${state.sessions.size} sessions)`;
      }),
    });

    // Match checkout events with geographic data
    let ordersWithGeo = 0;
    let ordersWithoutGeo = 0;

    checkoutEvents?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      const revenue = extractRevenue(event);

      if (revenue <= 0) return;

      // Try to find geographic data from geo events
      // Priority: address_validated > shipping_option_selected > checkout_start
      const sessionGeoEvents = geoEvents?.filter(
        (e: AnalyticsEvent) => e.session_id === sessionId
      ) || [];

      // Find the best geo event (prefer events with state data)
      let sessionGeoEvent = sessionGeoEvents.find(
        (e: AnalyticsEvent) => {
          const meta = e.metadata || {};
          return (e.event_type === 'address_validated' || e.event_type === 'shipping_option_selected') &&
            (meta.country || meta.state);
        }
      );

      // Fallback to any geo event with country/state
      if (!sessionGeoEvent) {
        sessionGeoEvent = sessionGeoEvents.find(
          (e: AnalyticsEvent) => {
            const meta = e.metadata || {};
            return meta.country || meta.state;
          }
        );
      }

      // If no geo event found, try to extract from checkout event metadata
      if (!sessionGeoEvent) {
        const checkoutMetadata = event.metadata || {};
        if (checkoutMetadata.country || checkoutMetadata.state) {
          // Create a virtual geo event from checkout metadata
          sessionGeoEvent = {
            ...event,
            metadata: checkoutMetadata,
          } as AnalyticsEvent;
        }
      }

      // Debug: log if we can't find geo data
      if (!sessionGeoEvent) {
        console.warn('‼️ [DEBUG] Geography - No geo data found for checkout session:', {
          sessionId: sessionId.substring(0, 12) + '...',
          sessionGeoEventsCount: sessionGeoEvents.length,
          sessionGeoEventTypes: sessionGeoEvents.map((e: AnalyticsEvent) => e.event_type),
          checkoutMetadata: Object.keys(event.metadata || {}),
        });
      }

      if (sessionGeoEvent) {
        ordersWithGeo++;
        let metadata = sessionGeoEvent.metadata || {};
        let country = (metadata.country as string) || 'Unknown';
        let state = (metadata.state as string) || 'Unknown';

        // If state is missing, try to find it from other events in the same session
        if ((!state || state === 'Unknown' || state.trim() === '') && sessionGeoEvents.length > 0) {
          const eventWithState = sessionGeoEvents.find((e: AnalyticsEvent) => {
            const meta = e.metadata || {};
            const stateValue = meta.state;
            return stateValue &&
              typeof stateValue === 'string' &&
              stateValue !== 'Unknown' &&
              stateValue.trim() !== '';
          });

          if (eventWithState) {
            const stateMeta = eventWithState.metadata || {};
            state = (stateMeta.state as string) || state;
            // Also update country if it's more reliable
            if (stateMeta.country && stateMeta.country !== 'Unknown') {
              country = (stateMeta.country as string) || country;
              metadata = stateMeta; // Use the metadata with state
            }
          }
        }

        // If state is still missing, check if we already have a state for this session
        // (created during initial geo events processing)
        if ((!state || state === 'Unknown' || state.trim() === '') && country !== 'Unknown') {
          // Find existing state entry that contains this session
          const existingStateEntry = Object.values(states).find(
            (s) => s.sessions.has(sessionId) && s.country === country
          );

          if (existingStateEntry) {
            state = existingStateEntry.state;
            console.info('✅ [DEBUG] Geography - Using existing state for session:', {
              sessionId: sessionId.substring(0, 12) + '...',
              country,
              state,
            });
          }
        }

        // Ensure country entry exists (might not have geo event but has checkout with location)
        if (!countries[country]) {
          countries[country] = {
            country,
            sessions: new Set(),
            orders: 0,
            revenue: 0,
            convertingSessions: new Set(),
          };
        }

        // Add session if not already tracked
        countries[country].sessions.add(sessionId);

        // Update country stats
        countries[country].orders++;
        countries[country].revenue += revenue;
        countries[country].convertingSessions.add(sessionId); // Track unique converting sessions

        // Update state stats (only if state is valid)
        if (state && state !== 'Unknown' && state.trim() !== '') {
          const stateKey = `${country}:${state}`;

          // Ensure state entry exists
          if (!states[stateKey]) {
            states[stateKey] = {
              country,
              state,
              sessions: new Set(),
              orders: 0,
              revenue: 0,
              convertingSessions: new Set(),
            };
          }

          // Add session to state if not already tracked
          states[stateKey].sessions.add(sessionId);

          // Update state stats
          states[stateKey].orders++;
          states[stateKey].revenue += revenue;
          states[stateKey].convertingSessions.add(sessionId); // Track unique converting sessions
        } else {
          // Debug: log when state is missing or invalid
          console.warn('‼️ [DEBUG] Geography - State missing or invalid for checkout:', {
            sessionId: sessionId.substring(0, 12) + '...',
            country,
            state,
            stateValue: metadata.state,
            hasState: !!metadata.state,
            eventType: sessionGeoEvent.event_type,
            allSessionEvents: sessionGeoEvents.map((e: AnalyticsEvent) => ({
              type: e.event_type,
              hasState: !!(e.metadata || {}).state,
              state: (e.metadata || {}).state,
            })),
          });
        }
      } else {
        ordersWithoutGeo++;
      }
    });

    console.info('✅ [DEBUG] Geography - Checkout matching:', {
      ordersWithGeo,
      ordersWithoutGeo,
      totalOrders: ordersWithGeo + ordersWithoutGeo,
      statesAfterMatching: Object.keys(states).length,
      statesWithOrders: Object.keys(states).filter(key => states[key].orders > 0).map(key => {
        const state = states[key];
        return `${state.country}:${state.state} (${state.orders} orders, ${state.revenue.toFixed(2)} revenue)`;
      }),
    });

    // Convert to arrays and calculate metrics
    const countryData = Object.values(countries)
      .map((country) => {
        const sessionCount = country.sessions.size;
        const convertingSessionsCount = country.convertingSessions.size;
        // Conversion rate = (unique converting sessions / total sessions) * 100
        const conversionRate = sessionCount > 0
          ? (convertingSessionsCount / sessionCount) * 100
          : 0;
        const avgOrderValue = country.orders > 0
          ? country.revenue / country.orders
          : 0;

        return {
          country: country.country,
          sessions: sessionCount,
          orders: country.orders,
          revenue: country.revenue,
          conversions: convertingSessionsCount, // Number of unique converting sessions
          conversionRate: Math.min(100, conversionRate), // Cap at 100%
          avgOrderValue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const stateData = Object.values(states)
      .map((state) => {
        const sessionCount = state.sessions.size;
        const convertingSessionsCount = state.convertingSessions.size;
        // Conversion rate = (unique converting sessions / total sessions) * 100
        const conversionRate = sessionCount > 0
          ? (convertingSessionsCount / sessionCount) * 100
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
          conversions: convertingSessionsCount, // Number of unique converting sessions
          conversionRate: Math.min(100, conversionRate), // Cap at 100%
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
    const totalConvertingSessions = Object.values(countries).reduce(
      (sum, country) => sum + country.convertingSessions.size,
      0
    );
    const overallConversionRate = totalSessions > 0
      ? Math.min(100, (totalConvertingSessions / totalSessions) * 100)
      : 0;

    console.info('✅ [DEBUG] Geography - Final summary:', {
      totalSessions,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      totalConvertingSessions,
      overallConversionRate: overallConversionRate.toFixed(2),
      countriesCount: countryData.length,
      statesCount: stateData.length,
      countryBreakdown: countryData.map(c => ({
        country: c.country,
        sessions: c.sessions,
        orders: c.orders,
        conversions: c.conversions,
        conversionRate: c.conversionRate.toFixed(2),
      })),
      stateBreakdown: stateData.map(s => ({
        state: `${s.state}, ${s.country}`,
        sessions: s.sessions,
        orders: s.orders,
        revenue: s.revenue.toFixed(2),
        conversions: s.conversions,
        conversionRate: s.conversionRate.toFixed(2),
      })),
    });

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
    console.error('❌ [DEBUG] Geography error:', error);
    return apiInternalError(error);
  }
}

