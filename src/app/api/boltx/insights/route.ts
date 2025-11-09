import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { createAIService } from '@/lib/ai/ai-service';
import { InsightCategory } from '@/lib/ai/types';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { getUserPlan } from '@/lib/api/plan-check';

/**
 * POST /api/boltx/insights
 * Generate AI insights from analytics data
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

    const body = await request.json().catch(() => ({}));
    const category = body.category as InsightCategory | undefined;
    // Map 'last_30_days' to 'month' for backward compatibility
    const periodParam = body.period === 'last_30_days' ? 'month' : body.period;
    const period = parsePeriod(periodParam || 'month');

    // Parse custom date range if period is custom
    let customStartDate: Date | null = null;
    let customEndDate: Date | null = null;

    if (period === 'custom') {
      const startDateParam = body.startDate;
      const endDateParam = body.endDate;

      if (startDateParam && endDateParam) {
        customStartDate = new Date(startDateParam);
        customEndDate = new Date(endDateParam);

        // Validate dates
        if (isNaN(customStartDate.getTime()) || isNaN(customEndDate.getTime())) {
          return apiError('Invalid date format. Use ISO 8601 format.', 400);
        }
      }
    }

    const supabaseAdmin = getSupabaseAdmin();
    const aiService = createAIService();

    if (!aiService) {
      return apiError('BoltX AI service is not available', 503);
    }

    // Get analytics data
    const range = getDateRange(period, customStartDate, customEndDate);
    const analyticsData = await getAnalyticsData(supabaseAdmin, user.account_id, range);

    // Generate insights
    const insights = await aiService.generateInsights(analyticsData, category);

    // Store insights in database using RPC function
    if (insights.length > 0) {
      // Helper function to ensure valid category
      const ensureValidCategory = (cat: InsightCategory): InsightCategory => {
        const validCategories: InsightCategory[] = ['revenue', 'conversion', 'ux', 'security'];
        return validCategories.includes(cat) ? cat : 'ux';
      };

      const insightsToInsert = insights.map((insight) => ({
        customer_id: user.account_id,
        category: ensureValidCategory(insight.category),
        title: insight.title,
        description: insight.description,
        impact: insight.impact,
        recommendations: insight.recommendations,
        metadata: insight.metadata || {},
        generated_at: insight.generatedAt.toISOString(),
      }));

      const { error: insertError } = await supabaseAdmin.rpc('insert_ai_insights', {
        p_insights: insightsToInsert as any, // Supabase will convert array to JSONB
      });

      if (insertError) {
        console.error('❌ [DEBUG] Error inserting insights:', insertError);
        // Continue execution even if insert fails - insights are still returned
      }
    }

    return apiSuccess({ insights });
  } catch (error) {
    console.error('❌ [DEBUG] Error in insights API:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * GET /api/boltx/insights
 * Get stored AI insights
 */
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as InsightCategory | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const supabaseAdmin = getSupabaseAdmin();

    // Use RPC function to get insights from analytics schema
    const { data: insights, error } = await supabaseAdmin.rpc('get_ai_insights', {
      p_customer_id: user.account_id,
      p_category: category || null,
      p_limit: limit,
    });

    if (error) {
      console.error('❌ [DEBUG] Error fetching insights:', error);
      return apiError('Failed to fetch insights', 500);
    }

    return apiSuccess({ insights: insights || [] });
  } catch (error) {
    console.error('❌ [DEBUG] Error in insights GET API:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * Get analytics data for insights generation
 */
async function getAnalyticsData(
  supabase: any,
  customerId: string,
  range: { start: Date; end: Date }
): Promise<Record<string, any>> {
  try {
    // Get basic metrics - we'll calculate them ourselves
    // Note: get_dashboard_metrics might not exist, so we calculate metrics directly
    const metrics: Record<string, any> = {};

    // Get abandonment data
    const { data: abandonmentData } = await supabase
      .rpc('get_analytics_events_by_types', {
        p_customer_id: customerId,
        p_event_types: ['checkout_start', 'checkout_complete', 'step_abandoned'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    // Calculate abandonment rate
    const sessions = new Set();
    let completed = 0;
    let abandoned = 0;

    abandonmentData?.forEach((event: any) => {
      if (event.event_type === 'checkout_start' || event.event_type === 'checkout_started') {
        sessions.add(event.session_id);
      }
      if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
        completed++;
      }
      if (event.event_type === 'step_abandoned') {
        abandoned++;
      }
    });

    const totalSessions = sessions.size;
    const abandonmentRate = totalSessions > 0 ? abandoned / totalSessions : 0;
    const conversionRate = totalSessions > 0 ? completed / totalSessions : 0;

    // Get average checkout time
    const { data: timeEvents } = await supabase
      .rpc('get_analytics_events_by_types', {
        p_customer_id: customerId,
        p_event_types: ['checkout_start', 'checkout_complete'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    const checkoutTimes: number[] = [];
    const sessionStarts: Record<string, Date> = {};

    timeEvents?.forEach((event: any) => {
      if (event.event_type === 'checkout_start' || event.event_type === 'checkout_started') {
        sessionStarts[event.session_id] = new Date(event.timestamp);
      }
      if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
        const start = sessionStarts[event.session_id];
        if (start) {
          const duration = (new Date(event.timestamp).getTime() - start.getTime()) / 1000;
          if (duration > 0) {
            checkoutTimes.push(duration);
          }
        }
      }
    });

    const avgCheckoutTime = checkoutTimes.length > 0
      ? checkoutTimes.reduce((a, b) => a + b, 0) / checkoutTimes.length
      : 0;

    return {
      abandonmentRate,
      conversionRate,
      avgCheckoutTime,
      totalSessions,
      completedSessions: completed,
      abandonedSessions: abandoned,
      ...metrics,
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error getting analytics data:', error);
    return {
      abandonmentRate: 0,
      conversionRate: 0,
      avgCheckoutTime: 0,
      totalSessions: 0,
    };
  }
}

