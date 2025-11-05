import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';

/**
 * POST /api/boltx/optimize
 * Apply optimization to checkout
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const body = await request.json();
    const {
      optimizationType,
      name,
      description,
      config,
      sessionId,
    } = body;

    if (!optimizationType || !name || !config) {
      return apiError('Missing required fields: optimizationType, name, config', 400);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create optimization record
    // Note: May need RPC function if schema access is restricted
    const { data: optimization, error } = await supabaseAdmin
      .from('analytics.ai_optimizations')
      .insert({
        customer_id: user.account_id,
        optimization_type: optimizationType,
        name,
        description,
        config,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [DEBUG] Error creating optimization:', error);
      return apiError('Failed to create optimization', 500);
    }

    return apiSuccess({ optimization });
  } catch (error) {
    console.error('❌ [DEBUG] Error in optimize API:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * GET /api/boltx/optimize
 * Get active optimizations
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const optimizationType = searchParams.get('type');

    const supabaseAdmin = getSupabaseAdmin();

    // Query optimizations
    // Note: May need RPC function if schema access is restricted
    let query = supabaseAdmin
      .from('analytics.ai_optimizations')
      .select('*')
      .eq('customer_id', user.account_id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (optimizationType) {
      query = query.eq('optimization_type', optimizationType);
    }

    const { data: optimizations, error } = await query;

    if (error) {
      console.error('❌ [DEBUG] Error fetching optimizations:', error);
      return apiError('Failed to fetch optimizations', 500);
    }

    return apiSuccess({ optimizations: optimizations || [] });
  } catch (error) {
    console.error('❌ [DEBUG] Error in optimize GET API:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * PATCH /api/boltx/optimize
 * Update optimization status
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const body = await request.json();
    const { id, status, metrics } = body;

    if (!id || !status) {
      return apiError('Missing required fields: id, status', 400);
    }

    const supabaseAdmin = getSupabaseAdmin();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (metrics) {
      updateData.metrics = metrics;
    }

    const { data: optimization, error } = await supabaseAdmin
      .from('analytics.ai_optimizations')
      .update(updateData)
      .eq('id', id)
      .eq('customer_id', user.account_id)
      .select()
      .single();

    if (error) {
      console.error('❌ [DEBUG] Error updating optimization:', error);
      return apiError('Failed to update optimization', 500);
    }

    return apiSuccess({ optimization });
  } catch (error) {
    console.error('❌ [DEBUG] Error in optimize PATCH API:', error);
    return apiError('Internal server error', 500);
  }
}

