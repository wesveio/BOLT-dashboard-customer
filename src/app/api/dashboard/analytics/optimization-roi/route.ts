import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';
import { checkDemoModeAndReturnMockSuccess } from '@/lib/api/demo-mode-check';

export const dynamic = 'force-dynamic';

/**
 * Extract revenue from event metadata with multiple fallbacks
 */
function extractRevenue(event: AnalyticsEvent): number {
  const metadata = event.metadata || {};
  const revenueValue =
    metadata.revenue ??
    metadata.value ??
    metadata.orderValue ??
    metadata.totalValue ??
    metadata.amount ??
    null;

  if (revenueValue === null || revenueValue === undefined) {
    return 0;
  }

  const numValue = typeof revenueValue === 'number'
    ? revenueValue
    : parseFloat(String(revenueValue));

  if (isNaN(numValue) || numValue < 0) {
    return 0;
  }

  return numValue;
}

/**
 * GET /api/dashboard/analytics/optimization-roi
 * Get optimization ROI analytics
 * 
 * Note: This is a simplified implementation that compares metrics before/after
 * a given date. In production, you would track feature flags or A/B test variants
 * in the events metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    // Check demo mode
    const mockResponse = await checkDemoModeAndReturnMockSuccess('analytics-optimization-roi', user.account_id, request);
    if (mockResponse) return mockResponse;

    const supabaseAdmin = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));
    const optimizationDate = searchParams.get('optimizationDate'); // ISO date string

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

    // If optimization date provided, split into before/after periods
    let beforeRange = range;
    let afterRange = range;

    if (optimizationDate) {
      const optDate = new Date(optimizationDate);
      beforeRange = {
        start: range.start,
        end: optDate,
      };
      afterRange = {
        start: optDate,
        end: range.end,
      };
    } else {
      // Default: split period in half
      const midDate = new Date(
        range.start.getTime() + (range.end.getTime() - range.start.getTime()) / 2
      );
      beforeRange = {
        start: range.start,
        end: midDate,
      };
      afterRange = {
        start: midDate,
        end: range.end,
      };
    }

    // Add debug logging
    console.info('✅ [DEBUG] Optimization ROI - Date ranges:', {
      period,
      optimizationDate: optimizationDate || 'auto-split',
      beforeRange: {
        start: beforeRange.start.toISOString(),
        end: beforeRange.end.toISOString(),
      },
      afterRange: {
        start: afterRange.start.toISOString(),
        end: afterRange.end.toISOString(),
      },
    });

    // Query events for both periods
    const [beforeEvents, afterEvents] = await Promise.all([
      supabaseAdmin.rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_start', 'checkout_complete', 'order_confirmed'],
        p_start_date: beforeRange.start.toISOString(),
        p_end_date: beforeRange.end.toISOString(),
      }),
      supabaseAdmin.rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_start', 'checkout_complete', 'order_confirmed'],
        p_start_date: afterRange.start.toISOString(),
        p_end_date: afterRange.end.toISOString(),
      }),
    ]);

    if (beforeEvents.error || afterEvents.error) {
      console.error('❌ [DEBUG] Get optimization ROI events error:', beforeEvents.error || afterEvents.error);
      return apiError('Failed to fetch optimization ROI data', 500);
    }

    console.info('✅ [DEBUG] Optimization ROI - Events found:', {
      beforeEvents: beforeEvents.data?.length || 0,
      afterEvents: afterEvents.data?.length || 0,
    });

    // Calculate metrics for before period
    const beforeStarts = new Set<string>();
    const beforeCompletes = new Set<string>();
    let beforeRevenue = 0;
    let beforeOrders = 0;
    let beforeEventsWithRevenue = 0;

    beforeEvents.data?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      if (event.event_type === 'checkout_start') {
        beforeStarts.add(sessionId);
      } else if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
        beforeCompletes.add(sessionId);
        const revenue = extractRevenue(event);
        if (revenue > 0) {
          beforeRevenue += revenue;
          beforeOrders++;
          beforeEventsWithRevenue++;
        }
      }
    });

    // Calculate metrics for after period
    const afterStarts = new Set<string>();
    const afterCompletes = new Set<string>();
    let afterRevenue = 0;
    let afterOrders = 0;
    let afterEventsWithRevenue = 0;

    afterEvents.data?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      if (event.event_type === 'checkout_start') {
        afterStarts.add(sessionId);
      } else if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
        afterCompletes.add(sessionId);
        const revenue = extractRevenue(event);
        if (revenue > 0) {
          afterRevenue += revenue;
          afterOrders++;
          afterEventsWithRevenue++;
        }
      }
    });

    console.info('✅ [DEBUG] Optimization ROI - Metrics calculated:', {
      before: {
        sessions: beforeStarts.size,
        conversions: beforeCompletes.size,
        revenue: beforeRevenue,
        orders: beforeOrders,
        eventsWithRevenue: beforeEventsWithRevenue,
      },
      after: {
        sessions: afterStarts.size,
        conversions: afterCompletes.size,
        revenue: afterRevenue,
        orders: afterOrders,
        eventsWithRevenue: afterEventsWithRevenue,
      },
    });

    // Calculate metrics
    const beforeSessions = beforeStarts.size;
    const afterSessions = afterStarts.size;
    const beforeConversions = beforeCompletes.size;
    const afterConversions = afterCompletes.size;
    const beforeConversionRate = beforeSessions > 0 ? (beforeConversions / beforeSessions) * 100 : 0;
    const afterConversionRate = afterSessions > 0 ? (afterConversions / afterSessions) * 100 : 0;
    const beforeAOV = beforeOrders > 0 ? beforeRevenue / beforeOrders : 0;
    const afterAOV = afterOrders > 0 ? afterRevenue / afterOrders : 0;

    // Calculate changes
    const revenueChange = afterRevenue - beforeRevenue;
    // When baseline is zero, percentage change is undefined - use null to indicate N/A
    const revenueChangePercent = beforeRevenue > 0 
      ? (revenueChange / beforeRevenue) * 100 
      : null; // null indicates no baseline for percentage calculation
    
    const conversionRateChange = afterConversionRate - beforeConversionRate;
    const conversionRateChangePercent = beforeConversionRate > 0
      ? (conversionRateChange / beforeConversionRate) * 100
      : null; // null indicates no baseline for percentage calculation
    
    const aovChange = afterAOV - beforeAOV;
    const aovChangePercent = beforeAOV > 0 
      ? (aovChange / beforeAOV) * 100 
      : null; // null indicates no baseline for percentage calculation

    console.info('✅ [DEBUG] Optimization ROI - Changes calculated:', {
      revenueChange,
      revenueChangePercent: revenueChangePercent !== null ? `${revenueChangePercent.toFixed(2)}%` : 'N/A (no baseline)',
      conversionRateChange,
      conversionRateChangePercent: conversionRateChangePercent !== null ? `${conversionRateChangePercent.toFixed(2)}%` : 'N/A (no baseline)',
      aovChange,
      aovChangePercent: aovChangePercent !== null ? `${aovChangePercent.toFixed(2)}%` : 'N/A (no baseline)',
    });

    // Calculate ROI
    // For now, assume optimization cost is 0 (can be passed as parameter in production)
    const optimizationCost = 0;
    const roi = optimizationCost > 0
      ? ((revenueChange - optimizationCost) / optimizationCost) * 100
      : revenueChange > 0
      ? Infinity
      : 0;

    // Calculate additional metrics
    const additionalOrders = afterOrders - beforeOrders;
    const additionalRevenue = revenueChange;

    return apiSuccess({
      summary: {
        beforePeriod: {
          start: beforeRange.start.toISOString(),
          end: beforeRange.end.toISOString(),
          sessions: beforeSessions,
          conversions: beforeConversions,
          conversionRate: beforeConversionRate,
          revenue: beforeRevenue,
          orders: beforeOrders,
          aov: beforeAOV,
        },
        afterPeriod: {
          start: afterRange.start.toISOString(),
          end: afterRange.end.toISOString(),
          sessions: afterSessions,
          conversions: afterConversions,
          conversionRate: afterConversionRate,
          revenue: afterRevenue,
          orders: afterOrders,
          aov: afterAOV,
        },
        changes: {
          revenueChange,
          revenueChangePercent,
          conversionRateChange,
          conversionRateChangePercent,
          aovChange,
          aovChangePercent,
          additionalOrders,
          additionalRevenue,
        },
        roi: {
          optimizationCost,
          additionalRevenue,
          roi,
          roiFormatted: optimizationCost > 0
            ? `${roi.toFixed(1)}%`
            : revenueChange > 0
            ? '∞'
            : '0%',
        },
      },
      period,
      optimizationDate: optimizationDate || beforeRange.end.toISOString(),
    });
  } catch (error) {
    console.error('❌ [DEBUG] Optimization ROI error:', error);
    return apiInternalError(error);
  }
}

