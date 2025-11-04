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
 * GET /api/dashboard/analytics/cohorts
 * Get detailed cohort analysis for customer retention
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

    // Calculate date range - extend back to capture cohorts
    const range = getDateRange(period);
    const extendedStart = new Date(range.start);
    extendedStart.setMonth(extendedStart.getMonth() - 12); // Look back 12 months for cohorts

    // Query all completed checkout events
    const { data: checkoutEvents, error: checkoutError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete', 'order_confirmed'],
        p_start_date: extendedStart.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (checkoutError) {
      console.error('Get cohorts checkout events error:', checkoutError);
      return apiError('Failed to fetch cohorts data', 500);
    }

    // Group orders by customer and determine cohort
    const customerCohorts: Record<string, {
      customerId: string | null;
      customerKey: string;
      cohortMonth: string; // YYYY-MM format
      firstOrderDate: Date;
      orders: Array<{
        date: Date;
        revenue: number;
        period: number; // Period number (0 = first month, 1 = second month, etc.)
      }>;
      totalRevenue: number;
      totalOrders: number;
    }> = {};

    checkoutEvents?.forEach((event: AnalyticsEvent) => {
      const revenue = extractRevenue(event);
      if (revenue <= 0) return;

      const customerKey = event.customer_id || event.order_form_id || event.session_id;
      const orderDate = new Date(event.timestamp);
      const cohortMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

      if (!customerCohorts[customerKey]) {
        customerCohorts[customerKey] = {
          customerId: event.customer_id,
          customerKey,
          cohortMonth,
          firstOrderDate: orderDate,
          orders: [],
          totalRevenue: 0,
          totalOrders: 0,
        };
      }

      const customer = customerCohorts[customerKey];
      
      // Use first order date as cohort month
      if (orderDate < customer.firstOrderDate) {
        customer.firstOrderDate = orderDate;
        customer.cohortMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      }

      // Calculate period (months since first order)
      const monthsDiff = (orderDate.getFullYear() - customer.firstOrderDate.getFullYear()) * 12 +
        (orderDate.getMonth() - customer.firstOrderDate.getMonth());

      customer.orders.push({
        date: orderDate,
        revenue,
        period: monthsDiff,
      });
      
      customer.totalRevenue += revenue;
      customer.totalOrders++;
    });

    // Group by cohort month
    const cohorts: Record<string, {
      cohort: string;
      customers: typeof customerCohorts;
      cohortSize: number;
      retentionByPeriod: Record<number, {
        customers: number;
        revenue: number;
        orders: number;
        retentionRate: number;
      }>;
    }> = {};

    Object.values(customerCohorts).forEach((customer) => {
      if (!cohorts[customer.cohortMonth]) {
        cohorts[customer.cohortMonth] = {
          cohort: customer.cohortMonth,
          customers: {},
          cohortSize: 0,
          retentionByPeriod: {},
        };
      }

      cohorts[customer.cohortMonth].customers[customer.customerKey] = customer;
      cohorts[customer.cohortMonth].cohortSize++;

      // Aggregate by period
      customer.orders.forEach((order) => {
        if (!cohorts[customer.cohortMonth].retentionByPeriod[order.period]) {
          cohorts[customer.cohortMonth].retentionByPeriod[order.period] = {
            customers: 0,
            revenue: 0,
            orders: 0,
            retentionRate: 0,
          };
        }

        const periodData = cohorts[customer.cohortMonth].retentionByPeriod[order.period];
        periodData.revenue += order.revenue;
        periodData.orders++;
      });
    });

    // Calculate retention rates for each period
    Object.values(cohorts).forEach((cohort) => {
      const cohortSize = cohort.cohortSize;
      
      Object.entries(cohort.retentionByPeriod).forEach(([periodStr, periodData]) => {
        const period = parseInt(periodStr);
        
        // Count unique customers who made purchases in this period
        const customersInPeriod = new Set<string>();
        Object.values(cohort.customers).forEach((customer) => {
          if (customer.orders.some(o => o.period === period)) {
            customersInPeriod.add(customer.customerKey);
          }
        });
        
        periodData.customers = customersInPeriod.size;
        periodData.retentionRate = cohortSize > 0 ? (customersInPeriod.size / cohortSize) * 100 : 0;
      });
    });

    // Format cohort data for response
    const cohortData = Object.values(cohorts)
      .sort((a, b) => a.cohort.localeCompare(b.cohort))
      .slice(-12) // Last 12 cohorts
      .map((cohort) => {
        // Calculate LTV for this cohort
        const totalRevenue = Object.values(cohort.customers).reduce(
          (sum, c) => sum + c.totalRevenue,
          0
        );
        const avgLTV = cohort.cohortSize > 0 ? totalRevenue / cohort.cohortSize : 0;

        // Format retention matrix (period 0-11)
        const retentionMatrix = Array.from({ length: 12 }, (_, period) => {
          const periodData = cohort.retentionByPeriod[period] || {
            customers: 0,
            revenue: 0,
            orders: 0,
            retentionRate: 0,
          };
          return {
            period,
            retentionRate: periodData.retentionRate,
            customers: periodData.customers,
            revenue: periodData.revenue,
            orders: periodData.orders,
          };
        });

        return {
          cohort: cohort.cohort,
          cohortSize: cohort.cohortSize,
          totalRevenue,
          avgLTV,
          retentionMatrix,
        };
      });

    // Calculate aggregate metrics
    const totalCohorts = cohortData.length;
    const totalCustomers = cohortData.reduce((sum, c) => sum + c.cohortSize, 0);
    const avgCohortSize = totalCohorts > 0 ? totalCustomers / totalCohorts : 0;
    const avgLTV = cohortData.length > 0
      ? cohortData.reduce((sum, c) => sum + c.avgLTV, 0) / cohortData.length
      : 0;

    // Calculate average retention rates by period
    const avgRetentionByPeriod: Record<number, number> = {};
    cohortData.forEach((cohort) => {
      cohort.retentionMatrix.forEach((period) => {
        if (!avgRetentionByPeriod[period.period]) {
          avgRetentionByPeriod[period.period] = 0;
        }
        avgRetentionByPeriod[period.period] += period.retentionRate;
      });
    });

    Object.keys(avgRetentionByPeriod).forEach((periodStr) => {
      const period = parseInt(periodStr);
      avgRetentionByPeriod[period] = totalCohorts > 0
        ? avgRetentionByPeriod[period] / totalCohorts
        : 0;
    });

    return apiSuccess({
      summary: {
        totalCohorts,
        totalCustomers,
        avgCohortSize,
        avgLTV,
        avgRetentionByPeriod,
      },
      cohorts: cohortData,
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

