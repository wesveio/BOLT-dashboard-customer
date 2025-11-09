import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';

/**
 * GET /api/boltx/personalization/metrics
 * Get aggregated metrics for personalization
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check Enterprise plan access
    const { hasEnterpriseAccess, error: planError } = await getUserPlan();
    if (!hasEnterpriseAccess) {
      return apiError(
        planError || 'BoltX is only available on Enterprise plan. Please upgrade to access this feature.',
        403
      );
    }

    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();
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

    // Get all profiles for the period using RPC function
    // If RPC doesn't exist, fall back to direct query
    let profiles: any[] | null = null;
    let profilesError: any = null;

    const { data: rpcData, error: rpcError } = await supabaseAdmin
      .rpc('get_user_profiles', {
        p_customer_id: user.account_id,
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
        p_device_type: null,
        p_status: 'all',
        p_limit: 1000, // Get more for metrics calculation
      });

    // If RPC function doesn't exist (error codes: 42883, P0001, PGRST202), try direct query
    // Note: Direct query won't work since table is in analytics schema, not public
    if (rpcError && (rpcError.code === '42883' || rpcError.code === 'P0001' || rpcError.code === 'PGRST202')) {
      console.warn('⚠️ [DEBUG] RPC function not found in schema cache. The function exists but PostgREST needs to refresh its cache.');
      console.warn('⚠️ [DEBUG] Attempting direct query fallback (may not work if table is in analytics schema)...');
      
      const { data: directData, error: directError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, session_id, device_type, browser, location, behavior, preferences, inferred_intent, created_at, updated_at')
        .eq('customer_id', user.account_id)
        .gte('updated_at', range.start.toISOString())
        .lte('updated_at', range.end.toISOString());

      // If direct query also fails (PGRST205 - table not in public schema), return empty data with warning
      // This allows the app to continue working while PostgREST cache refreshes
      if (directError && (directError.code === 'PGRST205' || directError.code === 'PGRST202')) {
        console.error('❌ [DEBUG] Direct query also failed. Table is in analytics schema, not public.');
        console.error('❌ [DEBUG] Solution: Run migration 046 and restart PostgREST to refresh schema cache.');
        console.warn('⚠️ [DEBUG] Returning empty metrics temporarily. PostgREST cache will refresh automatically in 1-5 minutes.');
        
        // Return empty metrics with a warning message instead of error
        // This allows the UI to continue working while cache refreshes
        return apiSuccess({
          totalProfiles: 0,
          activeProfiles: 0,
          personalizationRate: 0,
          personalizedConversionRate: 0,
          nonPersonalizedConversionRate: 0,
          deviceDistribution: {},
          conversionByDevice: {},
          period,
          warning: 'Database schema cache is refreshing. Data will be available shortly. If this persists, please run migration 046.',
        });
      }

      profiles = directData || [];
      profilesError = directError;
    } else {
      profiles = rpcData;
      profilesError = rpcError;
    }

    if (profilesError) {
      console.error('❌ [DEBUG] Error fetching profiles for metrics:', profilesError);
      return apiError('Failed to fetch profiles', 500);
    }

    // Calculate metrics
    const totalProfiles = profiles?.length || 0;
    
    // Active profiles (updated in last 24h)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeProfiles = profiles?.filter((p: any) => 
      new Date(p.updated_at) >= yesterday
    ).length || 0;

    // Device distribution
    const deviceDistribution: Record<string, number> = {};
    profiles?.forEach((profile: any) => {
      const device = profile.device_type || 'unknown';
      deviceDistribution[device] = (deviceDistribution[device] || 0) + 1;
    });

    // Get session outcomes to calculate conversion rates
    // We need to compare sessions with personalization vs without
    const profileSessionIds = new Set(profiles?.map((p: any) => p.session_id) || []);

    // Get all sessions from events
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: [
          'checkout_complete',
          'order_confirmed',
          'step_abandoned',
        ],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('❌ [DEBUG] Error fetching events for outcomes:', eventsError);
      // Continue without outcome data
    }

    // Build session outcome map
    const sessionOutcomes = new Map<string, 'converted' | 'abandoned' | 'unknown'>();
    if (events) {
      events.forEach((event: any) => {
        const sessionId = event.session_id;
        if (!sessionOutcomes.has(sessionId)) {
          if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
            sessionOutcomes.set(sessionId, 'converted');
          } else if (event.event_type === 'step_abandoned') {
            sessionOutcomes.set(sessionId, 'abandoned');
          }
        } else {
          // If already marked as converted, keep it
          if (sessionOutcomes.get(sessionId) === 'converted') {
            return;
          }
          if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
            sessionOutcomes.set(sessionId, 'converted');
          }
        }
      });
    }

    // Calculate conversion rates
    let personalizedConverted = 0;
    let personalizedTotal = 0;
    let nonPersonalizedConverted = 0;
    let nonPersonalizedTotal = 0;

    // Get all unique session IDs from events
    const allSessionIds = new Set<string>();
    if (events) {
      events.forEach((event: any) => {
        if (event.session_id) {
          allSessionIds.add(event.session_id);
        }
      });
    }

    // Calculate metrics for personalized vs non-personalized sessions
    allSessionIds.forEach((sessionId) => {
      const outcome = sessionOutcomes.get(sessionId);
      if (outcome === 'unknown') return;

      if (profileSessionIds.has(sessionId)) {
        // Session has personalization
        personalizedTotal++;
        if (outcome === 'converted') {
          personalizedConverted++;
        }
      } else {
        // Session without personalization
        nonPersonalizedTotal++;
        if (outcome === 'converted') {
          nonPersonalizedConverted++;
        }
      }
    });

    const personalizedConversionRate = personalizedTotal > 0
      ? (personalizedConverted / personalizedTotal) * 100
      : 0;
    const nonPersonalizedConversionRate = nonPersonalizedTotal > 0
      ? (nonPersonalizedConverted / nonPersonalizedTotal) * 100
      : 0;

    // Calculate personalization rate (% of sessions with personalization)
    const totalSessions = allSessionIds.size;
    const personalizationRate = totalSessions > 0
      ? (profileSessionIds.size / totalSessions) * 100
      : 0;

    // Calculate conversion by device type
    const conversionByDevice: Record<string, {
      total: number;
      converted: number;
      conversionRate: number;
    }> = {};

    profiles?.forEach((profile: any) => {
      const device = profile.device_type || 'unknown';
      const sessionId = profile.session_id;
      const outcome = sessionOutcomes.get(sessionId);

      if (!conversionByDevice[device]) {
        conversionByDevice[device] = {
          total: 0,
          converted: 0,
          conversionRate: 0,
        };
      }

      if (outcome !== 'unknown') {
        conversionByDevice[device].total++;
        if (outcome === 'converted') {
          conversionByDevice[device].converted++;
        }
      }
    });

    // Calculate conversion rates by device
    Object.keys(conversionByDevice).forEach((device) => {
      const data = conversionByDevice[device];
      data.conversionRate = data.total > 0
        ? (data.converted / data.total) * 100
        : 0;
    });

    const responseData = {
      totalProfiles,
      activeProfiles,
      personalizationRate,
      personalizedConversionRate,
      nonPersonalizedConversionRate,
      deviceDistribution,
      conversionByDevice,
      period,
    };

    console.info('✅ [DEBUG] Personalization metrics calculated:', {
      totalProfiles,
      activeProfiles,
      personalizationRate: personalizationRate.toFixed(2) + '%',
      personalizedConversionRate: personalizedConversionRate.toFixed(2) + '%',
      nonPersonalizedConversionRate: nonPersonalizedConversionRate.toFixed(2) + '%',
      deviceDistribution,
      conversionByDevice,
    });

    return apiSuccess(responseData);
  } catch (error) {
    console.error('❌ [DEBUG] Error in personalization metrics API:', error);
    return apiError('Internal server error', 500);
  }
}

