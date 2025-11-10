import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { UserProfile } from '@/lib/ai/types';
import { createFormOptimizer } from '@/lib/ai/form-optimizer';
import { getUserPlan } from '@/lib/api/plan-check';
import { shouldUseDemoData } from '@/lib/automation/demo-mode';
import { getMockDataFromRequest } from '@/lib/mock-data/mock-data-service';

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

    // Check if account is in demo mode
    const isDemo = await shouldUseDemoData(user.account_id);
    if (isDemo) {
      console.info('✅ [DEBUG] Account in demo mode, returning mock optimization data');
      const mockData = await getMockDataFromRequest('boltx-optimization', user.account_id, request);
      return apiSuccess(mockData);
    }

    // Check Enterprise plan access
    const { hasEnterpriseAccess, error: planError } = await getUserPlan();
    if (!hasEnterpriseAccess) {
      return apiError(
        planError || 'BoltX is only available on Enterprise plan. Please upgrade to access this feature.',
        403
      );
    }

    const body = await request.json();
    const {
      optimizationType,
      name,
      description,
      config,
    } = body;

    if (!optimizationType || !name || !config) {
      return apiError('Missing required fields: optimizationType, name, config', 400);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create optimization record using RPC function
    // PostgREST doesn't expose analytics schema directly
    const { data: optimizationData, error: rpcError } = await supabaseAdmin.rpc(
      'insert_ai_optimization',
      {
        p_customer_id: user.account_id,
        p_optimization_type: optimizationType,
        p_name: name,
        p_description: description || null,
        p_config: config || {},
        p_status: 'active',
        p_started_at: new Date().toISOString(),
      }
    );

    if (rpcError) {
      // If RPC function doesn't exist (error codes: 42883, P0001, PGRST202), try direct query as fallback
      if (rpcError.code === '42883' || rpcError.code === 'P0001' || rpcError.code === 'PGRST202') {
        console.warn('⚠️ [DEBUG] RPC function not found in PostgREST schema cache. Attempting direct query fallback...');

        const { data: optimization, error: directError } = await supabaseAdmin
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

        if (directError) {
          console.error('❌ [DEBUG] Error creating optimization:', directError);
          return apiError('Failed to create optimization. Please run migration 052 to expose the table via RPC functions.', 500);
        }

        return apiSuccess({ optimization });
      }

      console.error('❌ [DEBUG] Error creating optimization:', rpcError);
      return apiError('Failed to create optimization', 500);
    }

    const optimization = optimizationData && optimizationData.length > 0 ? optimizationData[0] : null;

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

    // Check if account is in demo mode
    const isDemo = await shouldUseDemoData(user.account_id);
    if (isDemo) {
      console.info('✅ [DEBUG] Account in demo mode, returning mock optimization data');
      const mockData = await getMockDataFromRequest('boltx-optimization', user.account_id, request);
      return apiSuccess(mockData);
    }

    // Check Enterprise plan access
    const { hasEnterpriseAccess, error: planError } = await getUserPlan();
    if (!hasEnterpriseAccess) {
      return apiError(
        planError || 'BoltX is only available on Enterprise plan. Please upgrade to access this feature.',
        403
      );
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

    // Query optimizations using RPC function
    // PostgREST doesn't expose analytics schema directly
    const { data: optimizations, error: rpcError } = await supabaseAdmin.rpc(
      'get_ai_optimizations',
      {
        p_customer_id: user.account_id,
        p_status: status,
        p_optimization_type: optimizationType || null,
        p_limit: 200,
      }
    );

    if (rpcError) {
      // If RPC function doesn't exist (error codes: 42883, P0001, PGRST202), try direct query as fallback
      if (rpcError.code === '42883' || rpcError.code === 'P0001' || rpcError.code === 'PGRST202') {
        console.warn('⚠️ [DEBUG] RPC function not found in PostgREST schema cache. Attempting direct query fallback...');

        let query = supabaseAdmin
          .from('analytics.ai_optimizations')
          .select('*')
          .eq('customer_id', user.account_id)
          .eq('status', status)
          .order('created_at', { ascending: false });

        if (optimizationType) {
          query = query.eq('optimization_type', optimizationType);
        }

        const { data: directData, error: directError } = await query;

        // If direct query also fails (PGRST205 - table not in public schema), return empty data with warning
        if (directError && (directError.code === 'PGRST205' || directError.code === 'PGRST202')) {
          console.error('❌ [DEBUG] Direct query also failed. Table is in analytics schema, not public.');
          console.error('❌ [DEBUG] Solution: Run migration 052 to expose ai_optimizations via RPC functions.');
          console.warn('⚠️ [DEBUG] Returning empty data temporarily. PostgREST cache will refresh automatically in 1-5 minutes.');

          return apiSuccess({
            optimizations: [],
            warning: 'Database schema cache is refreshing. Data will be available shortly. If this persists, please run migration 052.',
          });
        }

        if (directError) {
          console.error('❌ [DEBUG] Error fetching optimizations:', directError);
          return apiError('Failed to fetch optimizations', 500);
        }

        return apiSuccess({ optimizations: directData || [] });
      }

      console.error('❌ [DEBUG] Error fetching optimizations:', rpcError);
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
      behavior: {
        timeOnSite: 0,
        pagesVisited: 0,
        checkoutAttempts: 0,
      },
      preferences: {},
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error getting user profile:', error);
    return {
      sessionId,
      deviceType: 'desktop',
      browser: 'unknown',
      behavior: {
        timeOnSite: 0,
        pagesVisited: 0,
        checkoutAttempts: 0,
      },
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
    const { id, status, metrics } = body;

    if (!id || !status) {
      return apiError('Missing required fields: id, status', 400);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Update optimization using RPC function
    // PostgREST doesn't expose analytics schema directly
    const { data: optimizationData, error: rpcError } = await supabaseAdmin.rpc(
      'update_ai_optimization',
      {
        p_id: id,
        p_customer_id: user.account_id,
        p_status: status,
        p_metrics: metrics || null,
        p_completed_at: status === 'completed' ? new Date().toISOString() : null,
      }
    );

    if (rpcError) {
      // If RPC function doesn't exist (error codes: 42883, P0001, PGRST202), try direct query as fallback
      if (rpcError.code === '42883' || rpcError.code === 'P0001' || rpcError.code === 'PGRST202') {
        console.warn('⚠️ [DEBUG] RPC function not found in PostgREST schema cache. Attempting direct query fallback...');

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

        const { data: optimization, error: directError } = await supabaseAdmin
          .from('analytics.ai_optimizations')
          .update(updateData)
          .eq('id', id)
          .eq('customer_id', user.account_id)
          .select()
          .single();

        if (directError) {
          console.error('❌ [DEBUG] Error updating optimization:', directError);
          return apiError('Failed to update optimization. Please run migration 052 to expose the table via RPC functions.', 500);
        }

        return apiSuccess({ optimization });
      }

      console.error('❌ [DEBUG] Error updating optimization:', rpcError);
      return apiError('Failed to update optimization', 500);
    }

    const optimization = optimizationData && optimizationData.length > 0 ? optimizationData[0] : null;

    return apiSuccess({ optimization });
  } catch (error) {
    console.error('❌ [DEBUG] Error in optimize PATCH API:', error);
    return apiError('Internal server error', 500);
  }
}

