import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

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
 * GET /api/dashboard/analytics/ltv
 * Get Customer Lifetime Value (LTV) analytics
 * 
 * Note: Since we may not have customer_id in all events, we use order_form_id
 * as a proxy for customer identification. True LTV requires customer_id tracking.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Calculate date range
    const range = getDateRange(period);

    // Query completed checkout events
    const { data: checkoutEvents, error: checkoutError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete', 'order_confirmed'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (checkoutError) {
      console.error('Get LTV checkout events error:', checkoutError);
      return apiError('Failed to fetch LTV data', 500);
    }

    // Group by customer_id or order_form_id (fallback)
    // For better accuracy, prioritize customer_id if available
    const customerStats: Record<string, {
      customerId: string | null;
      orderFormIds: Set<string>;
      orders: number;
      revenue: number;
      firstOrderDate: Date;
      lastOrderDate: Date;
    }> = {};

    checkoutEvents?.forEach((event: AnalyticsEvent) => {
      const revenue = extractRevenue(event);
      if (revenue <= 0) return;

      // Extract customer_id from metadata if available, otherwise use fallback
      const metadata = event.metadata || {};
      const customerId = (metadata.customer_id as string) || null;
      // Use customer_id if available, otherwise use order_form_id as proxy
      const customerKey = customerId || event.order_form_id || event.session_id;

      if (!customerStats[customerKey]) {
        customerStats[customerKey] = {
          customerId,
          orderFormIds: new Set(),
          orders: 0,
          revenue: 0,
          firstOrderDate: new Date(event.timestamp),
          lastOrderDate: new Date(event.timestamp),
        };
      }

      const stats = customerStats[customerKey];
      stats.orders++;
      stats.revenue += revenue;

      if (event.order_form_id) {
        stats.orderFormIds.add(event.order_form_id);
      }

      const eventDate = new Date(event.timestamp);
      if (eventDate < stats.firstOrderDate) {
        stats.firstOrderDate = eventDate;
      }
      if (eventDate > stats.lastOrderDate) {
        stats.lastOrderDate = eventDate;
      }
    });

    // Calculate LTV metrics
    const customerData = Object.values(customerStats).map((stats) => {
      const daysBetween = Math.max(
        1,
        (stats.lastOrderDate.getTime() - stats.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const avgOrderValue = stats.orders > 0 ? stats.revenue / stats.orders : 0;
      const purchaseFrequency = daysBetween > 0 ? (stats.orders / daysBetween) * 30 : 0; // Orders per month

      return {
        customerId: stats.customerId,
        orders: stats.orders,
        revenue: stats.revenue,
        avgOrderValue,
        firstOrderDate: stats.firstOrderDate.toISOString(),
        lastOrderDate: stats.lastOrderDate.toISOString(),
        daysBetween: Math.round(daysBetween),
        purchaseFrequency,
        isRecurring: stats.orders > 1,
      };
    });

    // Calculate aggregate LTV
    const totalCustomers = customerData.length;
    const totalRevenue = customerData.reduce((sum, c) => sum + c.revenue, 0);
    const avgLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const avgOrdersPerCustomer = totalCustomers > 0
      ? customerData.reduce((sum, c) => sum + c.orders, 0) / totalCustomers
      : 0;

    // Segment customers by LTV
    const ltvSegments = {
      high: customerData.filter(c => c.revenue >= avgLTV * 1.5).length,
      medium: customerData.filter(c => c.revenue >= avgLTV * 0.5 && c.revenue < avgLTV * 1.5).length,
      low: customerData.filter(c => c.revenue < avgLTV * 0.5).length,
    };

    // Recurring customers
    const recurringCustomers = customerData.filter(c => c.isRecurring);
    const recurringRate = totalCustomers > 0
      ? (recurringCustomers.length / totalCustomers) * 100
      : 0;

    // Calculate LTV by channel/device if available
    const ltvBySegment: Record<string, {
      customers: number;
      totalRevenue: number;
      avgLTV: number;
    }> = {};

    // Group by customer segments (if we have device/channel data)
    customerData.forEach((customer) => {
      // For now, we'll use a simple segmentation
      // In the future, this could be enhanced with device/channel data
      const segment = customer.isRecurring ? 'recurring' : 'new';

      if (!ltvBySegment[segment]) {
        ltvBySegment[segment] = {
          customers: 0,
          totalRevenue: 0,
          avgLTV: 0,
        };
      }
      ltvBySegment[segment].customers++;
      ltvBySegment[segment].totalRevenue += customer.revenue;
    });

    // Calculate averages
    Object.keys(ltvBySegment).forEach((segment) => {
      const segmentData = ltvBySegment[segment];
      segmentData.avgLTV = segmentData.customers > 0
        ? segmentData.totalRevenue / segmentData.customers
        : 0;
    });

    return apiSuccess({
      summary: {
        totalCustomers,
        totalRevenue,
        avgLTV,
        avgOrdersPerCustomer,
        recurringRate,
        ltvSegments,
      },
      customers: customerData.sort((a, b) => b.revenue - a.revenue).slice(0, 100), // Top 100 customers
      ltvBySegment,
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

