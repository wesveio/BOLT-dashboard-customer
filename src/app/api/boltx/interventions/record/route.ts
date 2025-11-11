import { NextRequest, NextResponse } from 'next/server';
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
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/boltx/interventions/record
 * Record an intervention that was applied
 */
export const dynamic = 'force-dynamic';

/**
 * Get allowed origins for CORS
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];

  // In development, always allow localhost on any port
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost', 'http://127.0.0.1', ...envOrigins];
  }

  // In production, require explicit configuration
  return envOrigins.length > 0 ? envOrigins : [];
}

/**
 * Get CORS headers
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();

  // Check if origin is allowed (supports wildcards like localhost:*)
  const isAllowed = origin && (
    allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (origin === allowed) return true;
      // Support localhost:* pattern - match any localhost with any port
      if ((allowed.includes('localhost') || allowed.includes('127.0.0.1')) && 
          (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return true;
      }
      return false;
    })
  );

  // Use origin if allowed, otherwise use first allowed origin
  // When using credentials, we cannot use '*' - must use specific origin
  let corsOrigin: string;
  if (isAllowed && origin) {
    corsOrigin = origin;
  } else if (allowedOrigins.length > 0) {
    corsOrigin = allowedOrigins[0];
  } else if (process.env.NODE_ENV === 'development') {
    // In development, use the request origin if available, otherwise allow localhost
    // Cannot use '*' when credentials are included
    corsOrigin = origin || 'http://localhost:3000';
  } else {
    // In production, require explicit configuration
    // Default to first allowed origin or request origin
    corsOrigin = allowedOrigins[0] || origin || 'http://localhost:3000';
  }

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle OPTIONS request (preflight)
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.info('[⚡️BoltX Interventions Record] CORS Debug:', {
      origin,
      corsHeaders,
      allowedOrigins: getAllowedOrigins(),
    });
  }

  try {
    // Check Enterprise plan access
    const { hasEnterpriseAccess, error: planError } = await getUserPlan();
    if (!hasEnterpriseAccess) {
      const response = apiError(
        planError || 'BoltX is only available on Enterprise plan. Please upgrade to access this feature.',
        403
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      const response = apiError('User account not found', 404);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const body = await request.json();

    // Validate request body
    const validationResult = InterventionRecordSchema.safeParse(body);
    if (!validationResult.success) {
      const response = apiValidationError(validationResult.error);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
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
        const response = apiError('Failed to record intervention', 500);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }

      console.info('✅ [DEBUG] Intervention recorded via direct insert:', {
        interventionId: directData?.id,
        sessionId,
        interventionType,
        riskScore,
        riskLevel,
      });

      const response = apiSuccess({
        id: directData?.id,
        sessionId,
        interventionType,
        applied,
      });
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    if (rpcError) {
      console.error('❌ [DEBUG] Error recording intervention:', rpcError);
      const response = apiError('Failed to record intervention', 500);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    console.info('✅ [DEBUG] Intervention recorded via RPC:', {
      interventionId,
      sessionId,
      interventionType,
      riskScore,
      riskLevel,
    });

    const response = apiSuccess({
      id: interventionId,
      sessionId,
      interventionType,
      applied,
    });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('❌ [DEBUG] Error in interventions record POST:', error);
    const response = apiError('Internal server error', 500);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

