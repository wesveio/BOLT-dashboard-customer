import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';

/**
 * GET /api/boltx/optimization/metrics
 * Get aggregated metrics for form optimization
 */
export const dynamic = 'force-dynamic';

interface FieldPerformance {
  fieldName: string;
  step: string;
  completionRate: number;
  errorRate: number;
  avgTimeToComplete: number;
  totalAttempts: number;
  totalCompletions: number;
  totalErrors: number;
}

interface StepMetrics {
  totalFields: number;
  avgCompletionRate: number;
  avgErrorRate: number;
  avgTimeToComplete: number;
  optimizedSessions: number;
  nonOptimizedSessions: number;
  optimizedConversionRate: number;
  nonOptimizedConversionRate: number;
}

interface TrendDataPoint {
  date: string;
  avgCompletionRate: number;
  avgErrorRate: number;
  avgTimeToComplete: number;
  optimizedSessions: number;
}

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

    // Get field interaction events
    const { data: fieldEvents, error: fieldEventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: [
          'field_focused',
          'field_blurred',
          'field_error',
          'field_completed',
        ],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (fieldEventsError) {
      console.error('❌ [DEBUG] Error fetching field events:', fieldEventsError);
      // Continue with empty data
    }

    // Get checkout completion events to calculate conversion rates
    const { data: completionEvents, error: completionEventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: [
          'checkout_complete',
          'order_confirmed',
          'checkout_start',
        ],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (completionEventsError) {
      console.error('❌ [DEBUG] Error fetching completion events:', completionEventsError);
    }

    // Get optimization records to identify optimized sessions
    let optimizedSessions: Set<string> = new Set();
    try {
      // Use RPC function to get optimizations
      // PostgREST doesn't expose analytics schema directly
      const { data: optimizations, error: rpcError } = await supabaseAdmin.rpc(
        'get_ai_optimizations',
        {
          p_customer_id: user.account_id,
          p_status: 'active',
          p_optimization_type: null,
          p_limit: 200,
        }
      );

      // If RPC function doesn't exist, try direct query as fallback
      let optimizationsError = rpcError;
      let optimizationsData = optimizations;

      if (rpcError && (rpcError.code === '42883' || rpcError.code === 'P0001' || rpcError.code === 'PGRST202')) {
        console.warn('⚠️ [DEBUG] RPC function not found in PostgREST schema cache. Attempting direct query fallback...');
        
        const { data: directData, error: directError } = await supabaseAdmin
          .from('analytics.ai_optimizations')
          .select('config, created_at')
          .eq('customer_id', user.account_id)
          .eq('status', 'active')
          .gte('created_at', range.start.toISOString())
          .lte('created_at', range.end.toISOString());

        optimizationsError = directError;
        optimizationsData = directData;
      }

      if (!optimizationsError && optimizationsData) {
        // Filter optimizations by date range
        const filteredOptimizations = optimizationsData.filter((opt: any) => {
          const optDate = new Date(opt.created_at);
          return optDate >= range.start && optDate <= range.end;
        });

        // Extract session IDs from optimization configs
        // Note: This is a simplified approach - in production, you'd track which sessions received optimizations
        completionEvents?.forEach((event: any) => {
          if (event.event_type === 'checkout_start' && filteredOptimizations.length > 0) {
            // Assume sessions after optimization creation are optimized
            const sessionDate = new Date(event.timestamp || event.created_at);
            filteredOptimizations.forEach((opt: any) => {
              const optDate = new Date(opt.created_at);
              if (sessionDate >= optDate) {
                optimizedSessions.add(event.session_id);
              }
            });
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG] Could not fetch optimizations:', error);
    }

    // Process field events to calculate metrics
    const fieldMetrics: Record<string, {
      fieldName: string;
      step: string;
      completionCount: number;
      errorCount: number;
      attemptCount: number;
      totalTime: number;
      startTimes: Map<string, number>; // sessionId -> timestamp
    }> = {};

    fieldEvents?.forEach((event: any) => {
      const fieldName = event.metadata?.fieldName || event.metadata?.field_name;
      const step = event.step || event.metadata?.step || 'unknown';
      const sessionId = event.session_id;

      if (!fieldName || !sessionId) return;

      const key = `${step}:${fieldName}`;
      if (!fieldMetrics[key]) {
        fieldMetrics[key] = {
          fieldName,
          step,
          completionCount: 0,
          errorCount: 0,
          attemptCount: 0,
          totalTime: 0,
          startTimes: new Map(),
        };
      }

      const metrics = fieldMetrics[key];

      if (event.event_type === 'field_completed') {
        metrics.completionCount++;
        metrics.attemptCount++;
      } else if (event.event_type === 'field_error') {
        metrics.errorCount++;
        metrics.attemptCount++;
      } else if (event.event_type === 'field_focused') {
        metrics.attemptCount++;
        metrics.startTimes.set(sessionId, new Date(event.timestamp || event.created_at).getTime());
      } else if (event.event_type === 'field_blurred') {
        const startTime = metrics.startTimes.get(sessionId);
        if (startTime) {
          const timeSpent = new Date(event.timestamp || event.created_at).getTime() - startTime;
          metrics.totalTime += timeSpent;
          metrics.startTimes.delete(sessionId);
        }
      }
    });

    // Convert to FieldPerformance array
    const byField: FieldPerformance[] = Object.values(fieldMetrics).map((metrics) => ({
      fieldName: metrics.fieldName,
      step: metrics.step,
      completionRate: metrics.attemptCount > 0 ? metrics.completionCount / metrics.attemptCount : 0,
      errorRate: metrics.attemptCount > 0 ? metrics.errorCount / metrics.attemptCount : 0,
      avgTimeToComplete: metrics.completionCount > 0 ? metrics.totalTime / metrics.completionCount : 0,
      totalAttempts: metrics.attemptCount,
      totalCompletions: metrics.completionCount,
      totalErrors: metrics.errorCount,
    }));

    // Calculate step-level metrics
    const stepMetrics: Record<string, StepMetrics> = {
      profile: {
        totalFields: 0,
        avgCompletionRate: 0,
        avgErrorRate: 0,
        avgTimeToComplete: 0,
        optimizedSessions: 0,
        nonOptimizedSessions: 0,
        optimizedConversionRate: 0,
        nonOptimizedConversionRate: 0,
      },
      shipping: {
        totalFields: 0,
        avgCompletionRate: 0,
        avgErrorRate: 0,
        avgTimeToComplete: 0,
        optimizedSessions: 0,
        nonOptimizedSessions: 0,
        optimizedConversionRate: 0,
        nonOptimizedConversionRate: 0,
      },
      payment: {
        totalFields: 0,
        avgCompletionRate: 0,
        avgErrorRate: 0,
        avgTimeToComplete: 0,
        optimizedSessions: 0,
        nonOptimizedSessions: 0,
        optimizedConversionRate: 0,
        nonOptimizedConversionRate: 0,
      },
    };

    // Calculate averages per step
    ['profile', 'shipping', 'payment'].forEach((step) => {
      const stepFields = byField.filter((f) => f.step === step);
      stepMetrics[step].totalFields = stepFields.length;

      if (stepFields.length > 0) {
        stepMetrics[step].avgCompletionRate =
          stepFields.reduce((sum, f) => sum + f.completionRate, 0) / stepFields.length;
        stepMetrics[step].avgErrorRate =
          stepFields.reduce((sum, f) => sum + f.errorRate, 0) / stepFields.length;
        stepMetrics[step].avgTimeToComplete =
          stepFields.reduce((sum, f) => sum + f.avgTimeToComplete, 0) / stepFields.length;
      }
    });

    // Calculate conversion rates for optimized vs non-optimized sessions
    const sessionOutcomes = new Map<string, 'converted' | 'abandoned' | 'unknown'>();
    if (completionEvents) {
      completionEvents.forEach((event: any) => {
        const sessionId = event.session_id;
        if (!sessionOutcomes.has(sessionId)) {
          if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
            sessionOutcomes.set(sessionId, 'converted');
          }
        } else {
          if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
            sessionOutcomes.set(sessionId, 'converted');
          }
        }
      });
    }

    // Count optimized vs non-optimized conversions
    let optimizedConverted = 0;
    let optimizedTotal = 0;
    let nonOptimizedConverted = 0;
    let nonOptimizedTotal = 0;

    const allSessionIds = new Set<string>();
    completionEvents?.forEach((event: any) => {
      if (event.session_id && event.event_type === 'checkout_start') {
        allSessionIds.add(event.session_id);
      }
    });

    allSessionIds.forEach((sessionId) => {
      const outcome = sessionOutcomes.get(sessionId);
      if (outcome === 'unknown') return;

      if (optimizedSessions.has(sessionId)) {
        optimizedTotal++;
        if (outcome === 'converted') {
          optimizedConverted++;
        }
      } else {
        nonOptimizedTotal++;
        if (outcome === 'converted') {
          nonOptimizedConverted++;
        }
      }
    });

    const optimizedConversionRate = optimizedTotal > 0
      ? (optimizedConverted / optimizedTotal) * 100
      : 0;
    const nonOptimizedConversionRate = nonOptimizedTotal > 0
      ? (nonOptimizedConverted / nonOptimizedTotal) * 100
      : 0;

    const improvementRate = nonOptimizedConversionRate > 0
      ? ((optimizedConversionRate - nonOptimizedConversionRate) / nonOptimizedConversionRate) * 100
      : 0;

    // Calculate average completion time across all fields
    const avgCompletionTime = byField.length > 0
      ? byField.reduce((sum, f) => sum + f.avgTimeToComplete, 0) / byField.length
      : 0;

    // Calculate trend data (daily averages)
    const trendMap: Record<string, {
      completionRates: number[];
      errorRates: number[];
      times: number[];
      optimizedCount: number;
    }> = {};

    fieldEvents?.forEach((event: any) => {
      const date = new Date(event.timestamp || event.created_at);
      const dateKey = date.toISOString().split('T')[0];

      if (!trendMap[dateKey]) {
        trendMap[dateKey] = {
          completionRates: [],
          errorRates: [],
          times: [],
          optimizedCount: 0,
        };
      }

      // Count optimized sessions per day
      if (event.session_id && optimizedSessions.has(event.session_id)) {
        trendMap[dateKey].optimizedCount++;
      }
    });

    // Add field metrics to trend
    byField.forEach((field) => {
      // For simplicity, distribute field metrics across the period
      // In production, you'd track daily metrics separately
      Object.keys(trendMap).forEach((dateKey) => {
        trendMap[dateKey].completionRates.push(field.completionRate);
        trendMap[dateKey].errorRates.push(field.errorRate);
        trendMap[dateKey].times.push(field.avgTimeToComplete);
      });
    });

    const trend: TrendDataPoint[] = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        avgCompletionRate: data.completionRates.length > 0
          ? data.completionRates.reduce((a, b) => a + b, 0) / data.completionRates.length
          : 0,
        avgErrorRate: data.errorRates.length > 0
          ? data.errorRates.reduce((a, b) => a + b, 0) / data.errorRates.length
          : 0,
        avgTimeToComplete: data.times.length > 0
          ? data.times.reduce((a, b) => a + b, 0) / data.times.length
          : 0,
        optimizedSessions: data.optimizedCount,
      }));

    const totalOptimizations = optimizedSessions.size;

    const responseData = {
      totalOptimizations,
      optimizedConversionRate,
      nonOptimizedConversionRate,
      improvementRate,
      avgCompletionTime,
      byStep: stepMetrics,
      byField,
      trend,
      period,
    };

    console.info('✅ [DEBUG] Form optimization metrics calculated:', {
      totalOptimizations,
      optimizedConversionRate: optimizedConversionRate.toFixed(2) + '%',
      nonOptimizedConversionRate: nonOptimizedConversionRate.toFixed(2) + '%',
      improvementRate: improvementRate.toFixed(2) + '%',
      avgCompletionTime: avgCompletionTime.toFixed(0) + 'ms',
      fieldsCount: byField.length,
      stepsCount: Object.keys(stepMetrics).length,
    });

    return apiSuccess(responseData);
  } catch (error) {
    console.error('❌ [DEBUG] Error in form optimization metrics API:', error);
    return apiError('Internal server error', 500);
  }
}

