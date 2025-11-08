import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';

/**
 * GET /api/boltx/interventions
 * Get list of interventions with filters
 * Query params: period, type, status, result
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
    const type = searchParams.get('type'); // discount, security, simplify, progress
    const status = searchParams.get('status'); // applied, not-applied
    const result = searchParams.get('result'); // converted, abandoned, pending

    // Calculate date range
    const range = getDateRange(period);

    // Use RPC function to access analytics.ai_interventions
    // If RPC doesn't exist, fall back to direct query
    let interventions: any[] | null = null;
    let interventionsError: any = null;

    const { data: rpcData, error: rpcError } = await supabaseAdmin
      .rpc('get_ai_interventions', {
        p_customer_id: user.account_id,
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
        p_intervention_type: type || null,
        p_applied: status === 'applied' ? true : status === 'not-applied' ? false : null,
        p_result: result || null,
        p_limit: 200,
      });

    // If RPC function doesn't exist (error code 42883), try direct query
    if (rpcError && (rpcError.code === '42883' || rpcError.code === 'P0001')) {
      console.warn('⚠️ [DEBUG] RPC function not found, trying direct query. Please run migration 045.');
      const { data: directData, error: directError } = await supabaseAdmin
        .from('ai_interventions')
        .select('id, session_id, order_form_id, intervention_type, risk_score, risk_level, applied, applied_at, result, metadata, created_at')
        .eq('customer_id', user.account_id)
        .gte('created_at', range.start.toISOString())
        .lte('created_at', range.end.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (type) {
        // Apply type filter manually
        interventions = directData?.filter((i: any) => i.intervention_type === type) || [];
      } else {
        interventions = directData || [];
      }

      if (status === 'applied') {
        interventions = interventions.filter((i: any) => i.applied);
      } else if (status === 'not-applied') {
        interventions = interventions.filter((i: any) => !i.applied);
      }

      if (result) {
        interventions = interventions.filter((i: any) => i.result === result);
      }

      interventionsError = directError;
    } else {
      interventions = rpcData;
      interventionsError = rpcError;
    }

    if (interventionsError) {
      console.error('❌ [DEBUG] Error fetching interventions:', interventionsError);
      return apiError('Failed to fetch interventions', 500);
    }

    // Calculate effectiveness metrics by type
    const effectivenessByType: Record<string, {
      total: number;
      applied: number;
      converted: number;
      abandoned: number;
      conversionRate: number;
    }> = {};

    interventions?.forEach((intervention: any) => {
      const type = intervention.intervention_type;
      if (!effectivenessByType[type]) {
        effectivenessByType[type] = {
          total: 0,
          applied: 0,
          converted: 0,
          abandoned: 0,
          conversionRate: 0,
        };
      }

      effectivenessByType[type].total++;
      if (intervention.applied) {
        effectivenessByType[type].applied++;
      }
      if (intervention.result === 'converted') {
        effectivenessByType[type].converted++;
      } else if (intervention.result === 'abandoned') {
        effectivenessByType[type].abandoned++;
      }
    });

    // Calculate conversion rates
    Object.keys(effectivenessByType).forEach((type) => {
      const data = effectivenessByType[type];
      data.conversionRate = data.applied > 0
        ? (data.converted / data.applied) * 100
        : 0;
    });

    console.info('✅ [DEBUG] Interventions fetched:', {
      total: interventions?.length || 0,
      period,
      filters: { type, status, result },
      effectivenessByType,
    });

    return apiSuccess({
      interventions: interventions || [],
      effectivenessByType,
      period,
      total: interventions?.length || 0,
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in interventions API:', error);
    return apiError('Internal server error', 500);
  }
}

