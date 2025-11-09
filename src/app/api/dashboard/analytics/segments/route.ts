import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

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
 * GET /api/dashboard/analytics/segments
 * Get behavioral customer segmentation analytics
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

    // Query all checkout events
    const { data: checkoutEvents, error: checkoutError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete', 'order_confirmed'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (checkoutError) {
      console.error('Get segments checkout events error:', checkoutError);
      return apiError('Failed to fetch segments data', 500);
    }

    // Group by customer and calculate metrics
    const customerMetrics: Record<string, {
      customerId: string | null;
      customerKey: string;
      orders: number;
      totalRevenue: number;
      firstOrderDate: Date;
      lastOrderDate: Date;
      avgOrderValue: number;
      daysSinceLastOrder: number;
    }> = {};

    checkoutEvents?.forEach((event: AnalyticsEvent) => {
      const revenue = extractRevenue(event);
      if (revenue <= 0) return;

      // Extract customer_id from metadata if available, otherwise use fallback
      const metadata = event.metadata || {};
      const customerId = (metadata.customer_id as string) || null;
      const customerKey = customerId || event.order_form_id || event.session_id;
      const orderDate = new Date(event.timestamp);

      if (!customerMetrics[customerKey]) {
        customerMetrics[customerKey] = {
          customerId,
          customerKey,
          orders: 0,
          totalRevenue: 0,
          firstOrderDate: orderDate,
          lastOrderDate: orderDate,
          avgOrderValue: 0,
          daysSinceLastOrder: 0,
        };
      }

      const customer = customerMetrics[customerKey];
      customer.orders++;
      customer.totalRevenue += revenue;

      if (orderDate < customer.firstOrderDate) {
        customer.firstOrderDate = orderDate;
      }
      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
      }
    });

    // Calculate metrics for segmentation
    const customers = Object.values(customerMetrics);
    customers.forEach((customer) => {
      customer.avgOrderValue = customer.orders > 0 ? customer.totalRevenue / customer.orders : 0;
      customer.daysSinceLastOrder = Math.floor(
        (new Date().getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    });

    // Calculate averages and standard deviations for segmentation
    const avgAOV = customers.length > 0
      ? customers.reduce((sum, c) => sum + c.avgOrderValue, 0) / customers.length
      : 0;
    const avgOrders = customers.length > 0
      ? customers.reduce((sum, c) => sum + c.orders, 0) / customers.length
      : 0;

    // Calculate standard deviation for AOV
    const aovVariance = customers.length > 0
      ? customers.reduce((sum, c) => sum + Math.pow(c.avgOrderValue - avgAOV, 2), 0) / customers.length
      : 0;
    const aovStdDev = Math.sqrt(aovVariance);

    // Segment customers
    const segments: Record<string, {
      name: string;
      description: string;
      customers: typeof customers;
      metrics: {
        count: number;
        totalRevenue: number;
        avgLTV: number;
        avgAOV: number;
        avgOrders: number;
        conversionRate: number;
      };
    }> = {
      vip: {
        name: 'VIP Customers',
        description: 'High-value customers with AOV > average + 1 std dev',
        customers: [],
        metrics: {
          count: 0,
          totalRevenue: 0,
          avgLTV: 0,
          avgAOV: 0,
          avgOrders: 0,
          conversionRate: 0,
        },
      },
      frequent: {
        name: 'Frequent Buyers',
        description: 'Customers with 2+ orders',
        customers: [],
        metrics: {
          count: 0,
          totalRevenue: 0,
          avgLTV: 0,
          avgAOV: 0,
          avgOrders: 0,
          conversionRate: 0,
        },
      },
      new: {
        name: 'New Customers',
        description: 'First-time buyers',
        customers: [],
        metrics: {
          count: 0,
          totalRevenue: 0,
          avgLTV: 0,
          avgAOV: 0,
          avgOrders: 0,
          conversionRate: 0,
        },
      },
      atRisk: {
        name: 'At-Risk Customers',
        description: 'No order in 60+ days but previously active',
        customers: [],
        metrics: {
          count: 0,
          totalRevenue: 0,
          avgLTV: 0,
          avgAOV: 0,
          avgOrders: 0,
          conversionRate: 0,
        },
      },
      dormant: {
        name: 'Dormant Customers',
        description: 'No order in 90+ days',
        customers: [],
        metrics: {
          count: 0,
          totalRevenue: 0,
          avgLTV: 0,
          avgAOV: 0,
          avgOrders: 0,
          conversionRate: 0,
        },
      },
    };

    // Classify customers into segments
    customers.forEach((customer) => {
      // VIP: High AOV
      if (customer.avgOrderValue >= avgAOV + aovStdDev) {
        segments.vip.customers.push(customer);
      }

      // Frequent: Multiple orders
      if (customer.orders >= 2) {
        segments.frequent.customers.push(customer);
      }

      // New: First order in this period
      const daysSinceFirstOrder = Math.floor(
        (new Date().getTime() - customer.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceFirstOrder <= 30 && customer.orders === 1) {
        segments.new.customers.push(customer);
      }

      // At-Risk: No order in 60+ days but had orders before
      if (customer.daysSinceLastOrder >= 60 && customer.daysSinceLastOrder < 90 && customer.orders > 0) {
        segments.atRisk.customers.push(customer);
      }

      // Dormant: No order in 90+ days
      if (customer.daysSinceLastOrder >= 90) {
        segments.dormant.customers.push(customer);
      }
    });

    // Calculate metrics for each segment
    Object.values(segments).forEach((segment) => {
      const segmentCustomers = segment.customers;
      segment.metrics.count = segmentCustomers.length;
      segment.metrics.totalRevenue = segmentCustomers.reduce((sum, c) => sum + c.totalRevenue, 0);
      segment.metrics.avgLTV = segmentCustomers.length > 0
        ? segment.metrics.totalRevenue / segmentCustomers.length
        : 0;
      segment.metrics.avgAOV = segmentCustomers.length > 0
        ? segmentCustomers.reduce((sum, c) => sum + c.avgOrderValue, 0) / segmentCustomers.length
        : 0;
      segment.metrics.avgOrders = segmentCustomers.length > 0
        ? segmentCustomers.reduce((sum, c) => sum + c.orders, 0) / segmentCustomers.length
        : 0;
      
      // Conversion rate (percentage of total customers in this segment)
      segment.metrics.conversionRate = customers.length > 0
        ? (segmentCustomers.length / customers.length) * 100
        : 0;
    });

    // Calculate overall statistics
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
    const overallAvgLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // Format segment data
    const segmentData = Object.values(segments).map((segment) => ({
      name: segment.name,
      description: segment.description,
      metrics: segment.metrics,
    }));

    return apiSuccess({
      summary: {
        totalCustomers,
        totalRevenue,
        overallAvgLTV,
        avgAOV,
        avgOrders,
      },
      segments: segmentData,
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

