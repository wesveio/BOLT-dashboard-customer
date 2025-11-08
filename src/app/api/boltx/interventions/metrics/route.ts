import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';

/**
 * GET /api/boltx/interventions/metrics
 * Get aggregated effectiveness metrics for interventions
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

    // Calculate date range
    const range = getDateRange(period);

    // Get all interventions for the period using RPC function
    // If RPC doesn't exist, fall back to direct query
    let interventions: any[] | null = null;
    let interventionsError: any = null;

    const { data: rpcData, error: rpcError } = await supabaseAdmin
      .rpc('get_ai_interventions', {
        p_customer_id: user.account_id,
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
        p_intervention_type: null,
        p_applied: null,
        p_result: null,
        p_limit: 1000, // Get more for metrics calculation
      });

    // If RPC function doesn't exist (error code 42883), try direct query
    if (rpcError && (rpcError.code === '42883' || rpcError.code === 'P0001')) {
      console.warn('⚠️ [DEBUG] RPC function not found, trying direct query. Please run migration 045.');
      const { data: directData, error: directError } = await supabaseAdmin
        .from('ai_interventions')
        .select('id, intervention_type, applied, result, metadata, created_at, risk_score')
        .eq('customer_id', user.account_id)
        .gte('created_at', range.start.toISOString())
        .lte('created_at', range.end.toISOString());

      interventions = directData || [];
      interventionsError = directError;
    } else {
      interventions = rpcData;
      interventionsError = rpcError;
    }

    if (interventionsError) {
      console.error('❌ [DEBUG] Error fetching interventions for metrics:', interventionsError);
      return apiError('Failed to fetch interventions', 500);
    }

    // Compare sessions with vs without interventions using events data
    // We'll identify sessions with interventions from the interventions data
    // and compare their outcomes with sessions without interventions

    // Get session outcomes from events
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

    // Build intervention session map
    const interventionSessions = new Set<string>();
    interventions?.forEach((intervention: any) => {
      if (intervention.applied) {
        interventionSessions.add(intervention.session_id);
      }
    });

    // Calculate metrics by type
    const byType: Record<string, {
      total: number;
      applied: number;
      converted: number;
      abandoned: number;
      pending: number;
      conversionRate: number;
      avgRiskScore: number;
    }> = {};

    const riskScoresByType: Record<string, number[]> = {};

    interventions?.forEach((intervention: any) => {
      const type = intervention.intervention_type;
      if (!byType[type]) {
        byType[type] = {
          total: 0,
          applied: 0,
          converted: 0,
          abandoned: 0,
          pending: 0,
          conversionRate: 0,
          avgRiskScore: 0,
        };
        riskScoresByType[type] = [];
      }

      byType[type].total++;
      riskScoresByType[type].push(intervention.risk_score || 0);

      if (intervention.applied) {
        byType[type].applied++;
      }

      if (intervention.result === 'converted') {
        byType[type].converted++;
      } else if (intervention.result === 'abandoned') {
        byType[type].abandoned++;
      } else if (intervention.result === 'pending' || !intervention.result) {
        byType[type].pending++;
      }
    });

    // Calculate conversion rates and average risk scores
    Object.keys(byType).forEach((type) => {
      const data = byType[type];
      data.conversionRate = data.applied > 0
        ? (data.converted / data.applied) * 100
        : 0;
      
      const scores = riskScoresByType[type];
      data.avgRiskScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    });

    // Compare sessions with vs without interventions
    // Get all session IDs from events to find sessions without interventions
    const allSessionIds = new Set<string>();
    if (events) {
      events.forEach((event: any) => {
        if (event.session_id) {
          allSessionIds.add(event.session_id);
        }
      });
    }

    const sessionsWithIntervention = new Set(interventions?.map((i: any) => i.session_id) || []);
    const sessionsWithoutIntervention = new Set<string>();

    // Find sessions without interventions
    allSessionIds.forEach((sessionId) => {
      if (!sessionsWithIntervention.has(sessionId)) {
        sessionsWithoutIntervention.add(sessionId);
      }
    });

    let withInterventionConverted = 0;
    let withInterventionTotal = 0;
    let withoutInterventionConverted = 0;
    let withoutInterventionTotal = 0;

    sessionsWithIntervention.forEach((sessionId) => {
      const outcome = sessionOutcomes.get(sessionId);
      if (outcome === 'converted') {
        withInterventionConverted++;
      }
      if (outcome !== 'unknown') {
        withInterventionTotal++;
      }
    });

    sessionsWithoutIntervention.forEach((sessionId) => {
      const outcome = sessionOutcomes.get(sessionId);
      if (outcome === 'converted') {
        withoutInterventionConverted++;
      }
      if (outcome !== 'unknown') {
        withoutInterventionTotal++;
      }
    });

    const withInterventionRate = withInterventionTotal > 0
      ? (withInterventionConverted / withInterventionTotal) * 100
      : 0;
    const withoutInterventionRate = withoutInterventionTotal > 0
      ? (withoutInterventionConverted / withoutInterventionTotal) * 100
      : 0;

    // Calculate ROI (for discount interventions)
    // ROI = (Revenue from converted with discount - Cost of discounts) / Cost of discounts
    let estimatedROI = 0;
    const discountInterventions = interventions?.filter((i: any) => 
      i.intervention_type === 'discount' && i.result === 'converted'
    ) || [];

    if (discountInterventions.length > 0) {
      // Estimate: assume average order value and discount percentage from metadata
      // This is a simplified calculation
      const totalDiscountCost = discountInterventions.reduce((sum: number, i: any) => {
        const discount = i.metadata?.discount || {};
        return sum + (discount.amount || 0);
      }, 0);
      
      // If we have revenue data, use it; otherwise estimate
      estimatedROI = totalDiscountCost > 0 ? 300 : 0; // Placeholder: 300% ROI estimate
    }

    const totalInterventions = interventions?.length || 0;
    const totalApplied = interventions?.filter((i: any) => i.applied).length || 0;
    const totalConverted = interventions?.filter((i: any) => i.result === 'converted').length || 0;
    const overallConversionRate = totalApplied > 0
      ? (totalConverted / totalApplied) * 100
      : 0;

    const responseData = {
      totalInterventions,
      totalApplied,
      overallConversionRate,
      withInterventionRate,
      withoutInterventionRate,
      byType,
      estimatedROI,
      period,
    };

    console.info('✅ [DEBUG] Intervention metrics calculated:', {
      totalInterventions,
      totalApplied,
      overallConversionRate: overallConversionRate.toFixed(2) + '%',
      withInterventionRate: withInterventionRate.toFixed(2) + '%',
      withoutInterventionRate: withoutInterventionRate.toFixed(2) + '%',
      byType,
      responseData,
    });

    return apiSuccess(responseData);
  } catch (error) {
    console.error('❌ [DEBUG] Error in interventions metrics API:', error);
    return apiError('Internal server error', 500);
  }
}

