import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';

/**
 * GET /api/boltx/personalization/profiles
 * Get list of user profiles with filters
 * Query params: period, deviceType, status
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
    const deviceType = searchParams.get('deviceType'); // mobile, desktop, tablet, all
    const status = searchParams.get('status'); // active, inactive, all

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

    // Use RPC function to access analytics.user_profiles
    // If RPC doesn't exist, fall back to direct query
    let profiles: any[] | null = null;
    let profilesError: any = null;

    const { data: rpcData, error: rpcError } = await supabaseAdmin
      .rpc('get_user_profiles', {
        p_customer_id: user.account_id,
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
        p_device_type: deviceType && deviceType !== 'all' ? deviceType : null,
        p_status: status || 'all',
        p_limit: 200,
      });

    // If RPC function doesn't exist (error codes: 42883, P0001, PGRST202), try direct query
    // Note: Direct query won't work since table is in analytics schema, not public
    if (rpcError && (rpcError.code === '42883' || rpcError.code === 'P0001' || rpcError.code === 'PGRST202')) {
      console.warn('⚠️ [DEBUG] RPC function not found in schema cache. The function exists but PostgREST needs to refresh its cache.');
      console.warn('⚠️ [DEBUG] Attempting direct query fallback (may not work if table is in analytics schema)...');
      
      const { data: directData, error: directError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, session_id, device_type, browser, location, behavior, preferences, inferred_intent, metadata, created_at, updated_at')
        .eq('customer_id', user.account_id)
        .gte('updated_at', range.start.toISOString())
        .lte('updated_at', range.end.toISOString())
        .order('updated_at', { ascending: false })
        .limit(200);

      // If direct query also fails (PGRST205 - table not in public schema), return empty data with warning
      // This allows the app to continue working while PostgREST cache refreshes
      if (directError && (directError.code === 'PGRST205' || directError.code === 'PGRST202')) {
        console.error('❌ [DEBUG] Direct query also failed. Table is in analytics schema, not public.');
        console.error('❌ [DEBUG] Solution: Run migration 046 and restart PostgREST to refresh schema cache.');
        console.warn('⚠️ [DEBUG] Returning empty data temporarily. PostgREST cache will refresh automatically in 1-5 minutes.');
        
        // Return empty data with a warning message instead of error
        // This allows the UI to continue working while cache refreshes
        return apiSuccess({
          profiles: [],
          deviceDistribution: {},
          activeProfiles: 0,
          totalProfiles: 0,
          period,
          warning: 'Database schema cache is refreshing. Data will be available shortly. If this persists, please run migration 046.',
        });
      }

      profiles = directData || [];
      profilesError = directError;

      // Apply filters manually
      if (deviceType && deviceType !== 'all') {
        profiles = profiles.filter((p: any) => p.device_type === deviceType);
      }

      if (status === 'active') {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        profiles = profiles.filter((p: any) => new Date(p.updated_at) >= yesterday);
      } else if (status === 'inactive') {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        profiles = profiles.filter((p: any) => new Date(p.updated_at) < yesterday);
      }
    } else {
      profiles = rpcData;
      profilesError = rpcError;
    }

    if (profilesError) {
      console.error('❌ [DEBUG] Error fetching profiles:', profilesError);
      return apiError('Failed to fetch profiles', 500);
    }

    // Calculate distribution by device type
    const deviceDistribution: Record<string, number> = {};
    profiles?.forEach((profile: any) => {
      const device = profile.device_type || 'unknown';
      deviceDistribution[device] = (deviceDistribution[device] || 0) + 1;
    });

    // Calculate active profiles (updated in last 24h)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const activeProfiles = profiles?.filter((p: any) => 
      new Date(p.updated_at) >= yesterday
    ).length || 0;

    console.info('✅ [DEBUG] Profiles fetched:', {
      total: profiles?.length || 0,
      active: activeProfiles,
      period,
      filters: { deviceType, status },
      deviceDistribution,
    });

    return apiSuccess({
      profiles: profiles || [],
      deviceDistribution,
      activeProfiles,
      totalProfiles: profiles?.length || 0,
      period,
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in profiles API:', error);
    return apiError('Internal server error', 500);
  }
}

