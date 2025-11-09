import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';
import { z } from 'zod';

/**
 * Intervention record schema
 */
const InterventionRecordSchema = z.object({
  sessionId: z.string().min(1),
  orderFormId: z.string().optional(),
  interventionType: z.enum(['discount', 'security', 'simplify', 'progress']),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  applied: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/boltx/interventions/record
 * Record an intervention that was applied
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate request body
    const validationResult = InterventionRecordSchema.safeParse(body);
    if (!validationResult.success) {
      return apiValidationError(validationResult.error);
    }

    const {
      sessionId,
      orderFormId,
      interventionType,
      riskScore,
      riskLevel,
      applied,
      metadata,
    } = validationResult.data;

    const supabaseAdmin = getSupabaseAdmin();

    // Try direct insert first (PostgREST may not expose analytics schema directly)
    // Use RPC function as primary method since PostgREST doesn't expose analytics schema tables
    const { data: interventionId, error: rpcError } = await supabaseAdmin.rpc(
      'insert_ai_intervention',
      {
        p_customer_id: user.account_id,
        p_session_id: sessionId,
        p_order_form_id: orderFormId || null,
        p_intervention_type: interventionType,
        p_risk_score: riskScore,
        p_risk_level: riskLevel,
        p_metadata: metadata || {},
      }
    );

    // If RPC function doesn't exist or fails, try direct insert as fallback
    if (rpcError && (rpcError.code === '42883' || rpcError.code === 'P0001')) {
      console.warn('⚠️ [DEBUG] RPC function not found, trying direct insert. Please run migration 039.');
      
      const { data: directData, error: directError } = await supabaseAdmin
        .from('analytics.ai_interventions')
        .insert({
        customer_id: user.account_id,
        session_id: sessionId,
        order_form_id: orderFormId || null,
        intervention_type: interventionType,
        risk_score: riskScore,
        risk_level: riskLevel,
        applied: applied,
        applied_at: applied ? new Date().toISOString() : null,
        metadata: metadata || {},
      })
      .select('id')
      .single();

      if (directError) {
        console.error('❌ [DEBUG] Error inserting intervention (both methods failed):', {
          rpcError,
          directError,
        });
        return apiError('Failed to record intervention', 500);
      }

      console.info('✅ [DEBUG] Intervention recorded via direct insert:', {
        interventionId: directData?.id,
        sessionId,
        interventionType,
        riskScore,
        riskLevel,
      });

      return apiSuccess({
        id: directData?.id,
        sessionId,
        interventionType,
        applied,
      });
    }

    if (rpcError) {
      console.error('❌ [DEBUG] Error recording intervention:', rpcError);
      return apiError('Failed to record intervention', 500);
    }

    console.info('✅ [DEBUG] Intervention recorded via RPC:', {
      interventionId,
      sessionId,
      interventionType,
      riskScore,
      riskLevel,
    });

    return apiSuccess({
      id: interventionId,
      sessionId,
      interventionType,
      applied,
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in interventions record POST:', error);
    return apiError('Internal server error', 500);
  }
}

