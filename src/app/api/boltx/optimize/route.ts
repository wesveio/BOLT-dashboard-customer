import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { FormOptimization, UserProfile } from '@/lib/ai/types';
import { createFormOptimizer } from '@/lib/ai/form-optimizer';
import { UserProfileBuilder } from '@/lib/ai/user-profile-builder';

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
 * Get form optimization for a checkout session
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const step = searchParams.get('step');

    // If sessionId provided, return real-time optimization
    if (sessionId) {
      if (!step) {
        return apiError('Step is required when sessionId is provided', 400);
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Get user profile
      const profile = await getUserProfile(supabaseAdmin, user.account_id, sessionId);

      // Get field analytics (if available)
      const fieldAnalytics = await getFieldAnalytics(supabaseAdmin, sessionId, step);

      // Generate form optimization
      const optimizer = createFormOptimizer();
      const optimization = optimizer.generateOptimization(profile, step, fieldAnalytics);

      return apiSuccess(optimization);
    }

    // Otherwise, return stored optimizations (for dashboard)
    const status = searchParams.get('status') || 'active';
    const optimizationType = searchParams.get('type');

    const supabaseAdmin = getSupabaseAdmin();

    // Query optimizations
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
 * Get or create user profile
 */
async function getUserProfile(
  supabase: any,
  customerId: string,
  sessionId: string
): Promise<UserProfile> {
  try {
    let profiles: any = null;
    try {
      const result = await supabase.rpc('get_user_profile_by_session', {
        p_session_id: sessionId,
        p_customer_id: customerId,
      });
      profiles = result.data;
    } catch {
      // RPC doesn't exist, return default profile
    }

    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      return {
        sessionId,
        deviceType: profile.device_type || 'desktop',
        browser: profile.browser || 'unknown',
        location: profile.location || undefined,
        behavior: profile.behavior || {},
        preferences: profile.preferences || {},
        inferredIntent: profile.inferred_intent || undefined,
      };
    }

    return {
      sessionId,
      deviceType: 'desktop',
      browser: 'unknown',
      behavior: {},
      preferences: {},
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error getting user profile:', error);
    return {
      sessionId,
      deviceType: 'desktop',
      browser: 'unknown',
      behavior: {},
      preferences: {},
    };
  }
}

/**
 * Get field analytics for step
 */
async function getFieldAnalytics(
  supabase: any,
  sessionId: string,
  step: string
): Promise<any[]> {
  try {
    // Query analytics events for field interactions
    const { data: events, error } = await supabase
      .from('analytics.events')
      .select('*')
      .eq('session_id', sessionId)
      .eq('step', step)
      .in('event_type', ['field_focused', 'field_blurred', 'field_error', 'field_completed'])
      .order('timestamp', { ascending: true });

    if (error) {
      console.warn('⚠️ [DEBUG] Error fetching field analytics:', error);
      return [];
    }

    // Process events to calculate metrics
    const fieldMetrics: Record<string, any> = {};

    events?.forEach((event: any) => {
      const fieldName = event.metadata?.fieldName || event.metadata?.field_name;
      if (!fieldName) return;

      if (!fieldMetrics[fieldName]) {
        fieldMetrics[fieldName] = {
          fieldName,
          completionCount: 0,
          errorCount: 0,
          attemptCount: 0,
          totalTime: 0,
        };
      }

      const metrics = fieldMetrics[fieldName];

      if (event.event_type === 'field_completed') {
        metrics.completionCount++;
        metrics.attemptCount++;
      } else if (event.event_type === 'field_error') {
        metrics.errorCount++;
        metrics.attemptCount++;
      } else if (event.event_type === 'field_focused') {
        metrics.attemptCount++;
        metrics.startTime = new Date(event.timestamp).getTime();
      } else if (event.event_type === 'field_blurred' && metrics.startTime) {
        const timeSpent = new Date(event.timestamp).getTime() - metrics.startTime;
        metrics.totalTime += timeSpent;
        metrics.startTime = undefined;
      }
    });

    // Convert to array and calculate rates
    return Object.values(fieldMetrics).map((metrics: any) => ({
      fieldName: metrics.fieldName,
      visibility: true,
      order: 0,
      required: true,
      completionRate: metrics.attemptCount > 0 ? metrics.completionCount / metrics.attemptCount : 0,
      errorRate: metrics.attemptCount > 0 ? metrics.errorCount / metrics.attemptCount : 0,
      avgTimeToComplete: metrics.completionCount > 0 ? metrics.totalTime / metrics.completionCount : 0,
    }));
  } catch (error) {
    console.warn('⚠️ [DEBUG] Error processing field analytics:', error);
    return [];
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

