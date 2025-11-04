import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

export const dynamic = 'force-dynamic';

/**
 * Extract revenue from event metadata with multiple fallbacks
 * Tries different field names and validates the value
 */
function extractRevenue(event: AnalyticsEvent): number {
  const metadata = event.metadata || {};

  // Try different revenue field names
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

  // Convert to number
  const numValue = typeof revenueValue === 'number'
    ? revenueValue
    : parseFloat(String(revenueValue));

  // Validate and return
  if (isNaN(numValue) || numValue < 0) {
    return 0;
  }

  return numValue;
}

/**
 * GET /api/dashboard/analytics/payment
 * Get payment method analytics for the authenticated user's account
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get payment method data from analytics.events
    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Calculate date range
    const range = getDateRange(period);

    // Query payment-related events using RPC function (required for custom schema)
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['payment_method_selected', 'payment_completed', 'payment_failed'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('Get payment analytics error:', eventsError);
      return apiError('Failed to fetch payment analytics', 500);
    }

    // Aggregate payment methods
    const paymentMethods: Record<string, {
      name: string;
      count: number;
      revenue: number;
      successCount: number;
      failedCount: number;
    }> = {};

    events?.forEach((event: AnalyticsEvent) => {
      const method = event.metadata?.paymentMethod as string || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          name: method,
          count: 0,
          revenue: 0,
          successCount: 0,
          failedCount: 0,
        };
      }

      paymentMethods[method].count++;

      if (event.event_type === 'payment_completed') {
        paymentMethods[method].successCount++;
        // Use extractRevenue function to get revenue with multiple fallbacks
        const revenue = extractRevenue(event);
        if (revenue > 0) {
          paymentMethods[method].revenue += revenue;
        }
      } else if (event.event_type === 'payment_failed') {
        paymentMethods[method].failedCount++;
      }
    });

    // Convert to array and calculate success rates
    const paymentData = Object.values(paymentMethods).map((method) => ({
      name: method.name,
      value: method.count,
      revenue: method.revenue,
      successRate: method.count > 0
        ? (method.successCount / method.count) * 100
        : 0,
    }));

    const totalPayments = paymentData.reduce((sum, item) => sum + item.value, 0);
    const avgSuccessRate = paymentData.length > 0
      ? paymentData.reduce((sum, item) => sum + item.successRate, 0) / paymentData.length
      : 0;

    return apiSuccess({
      paymentMethods: paymentData,
      totalPayments,
      avgSuccessRate: avgSuccessRate.toFixed(1),
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

