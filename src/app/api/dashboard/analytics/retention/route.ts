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
 * GET /api/dashboard/analytics/retention
 * Get customer retention and churn analytics
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

    // Calculate date range - extend back to capture first purchases
    const range = getDateRange(period);
    // Look back further to identify first purchases
    const extendedStart = new Date(range.start);
    extendedStart.setMonth(extendedStart.getMonth() - 6); // Look back 6 months

    // Query all completed checkout events
    const { data: checkoutEvents, error: checkoutError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete', 'order_confirmed'],
        p_start_date: extendedStart.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (checkoutError) {
      console.error('Get retention checkout events error:', checkoutError);
      return apiError('Failed to fetch retention data', 500);
    }

    // Group orders by customer (using customer_id or order_form_id as fallback)
    const customerOrders: Record<string, {
      customerId: string | null;
      orders: Array<{
        date: Date;
        revenue: number;
        orderFormId: string | null;
      }>;
      firstOrderDate: Date;
      lastOrderDate: Date;
    }> = {};

    checkoutEvents?.forEach((event: AnalyticsEvent) => {
      const revenue = extractRevenue(event);
      if (revenue <= 0) return;

      // Extract customer_id from metadata if available, otherwise use fallback
      const metadata = event.metadata || {};
      const customerId = (metadata.customer_id as string) || null;
      const customerKey = customerId || event.order_form_id || event.session_id;
      const orderDate = new Date(event.timestamp);

      if (!customerOrders[customerKey]) {
        customerOrders[customerKey] = {
          customerId,
          orders: [],
          firstOrderDate: orderDate,
          lastOrderDate: orderDate,
        };
      }

      const customer = customerOrders[customerKey];
      customer.orders.push({
        date: orderDate,
        revenue,
        orderFormId: event.order_form_id,
      });

      if (orderDate < customer.firstOrderDate) {
        customer.firstOrderDate = orderDate;
      }
      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
      }
    });

    // Calculate retention metrics
    const now = new Date();
    const customers = Object.values(customerOrders);

    // Categorize customers
    const newCustomers = customers.filter(c => {
      const daysSinceFirstOrder = (now.getTime() - c.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceFirstOrder <= 30 && c.orders.length === 1;
    });

    const returningCustomers = customers.filter(c => c.orders.length > 1);

    const churnedCustomers = customers.filter(c => {
      const daysSinceLastOrder = (now.getTime() - c.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastOrder > 60 && c.orders.length > 0; // No order in 60+ days
    });

    // Calculate retention rates by period
    const retentionRates = {
      d1: calculateRetentionRate(customers, 1),
      d7: calculateRetentionRate(customers, 7),
      d30: calculateRetentionRate(customers, 30),
      d90: calculateRetentionRate(customers, 90),
    };

    // Calculate average purchase frequency
    const avgPurchaseFrequency = customers.length > 0
      ? customers.reduce((sum, c) => sum + c.orders.length, 0) / customers.length
      : 0;

    // Calculate average days between purchases for returning customers
    const avgDaysBetweenPurchases = returningCustomers.length > 0
      ? returningCustomers.reduce((sum, customer) => {
          if (customer.orders.length < 2) return sum;
          
          const sortedOrders = customer.orders.sort((a, b) => a.date.getTime() - b.date.getTime());
          let totalDays = 0;
          for (let i = 1; i < sortedOrders.length; i++) {
            totalDays += (sortedOrders[i].date.getTime() - sortedOrders[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
          }
          return sum + (totalDays / (sortedOrders.length - 1));
        }, 0) / returningCustomers.length
      : 0;

    // Calculate churn rate
    const totalCustomers = customers.length;
    const churnRate = totalCustomers > 0
      ? (churnedCustomers.length / totalCustomers) * 100
      : 0;

    // Calculate retention rate (percentage of customers who made repeat purchases)
    const retentionRate = totalCustomers > 0
      ? (returningCustomers.length / totalCustomers) * 100
      : 0;

    // Cohort analysis - group by month of first purchase
    const cohorts: Record<string, {
      cohort: string;
      firstPurchaseDate: Date;
      customers: typeof customers;
      retentionByPeriod: {
        d30: number;
        d60: number;
        d90: number;
      };
    }> = {};

    customers.forEach((customer) => {
      const cohortKey = `${customer.firstOrderDate.getFullYear()}-${String(customer.firstOrderDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = {
          cohort: cohortKey,
          firstPurchaseDate: customer.firstOrderDate,
          customers: [],
          retentionByPeriod: {
            d30: 0,
            d60: 0,
            d90: 0,
          },
        };
      }
      
      cohorts[cohortKey].customers.push(customer);
    });

    // Calculate retention for each cohort
    Object.values(cohorts).forEach((cohort) => {
      const cohortSize = cohort.customers.length;
      if (cohortSize === 0) return;

      const d30Date = new Date(cohort.firstPurchaseDate);
      d30Date.setDate(d30Date.getDate() + 30);
      const d60Date = new Date(cohort.firstPurchaseDate);
      d60Date.setDate(d60Date.getDate() + 60);
      const d90Date = new Date(cohort.firstPurchaseDate);
      d90Date.setDate(d90Date.getDate() + 90);

      cohort.retentionByPeriod.d30 = cohort.customers.filter(c => 
        c.lastOrderDate >= d30Date || c.orders.some(o => o.date >= d30Date)
      ).length / cohortSize * 100;

      cohort.retentionByPeriod.d60 = cohort.customers.filter(c => 
        c.lastOrderDate >= d60Date || c.orders.some(o => o.date >= d60Date)
      ).length / cohortSize * 100;

      cohort.retentionByPeriod.d90 = cohort.customers.filter(c => 
        c.lastOrderDate >= d90Date || c.orders.some(o => o.date >= d90Date)
      ).length / cohortSize * 100;
    });

    // Sort cohorts by date
    const cohortData = Object.values(cohorts)
      .sort((a, b) => a.firstPurchaseDate.getTime() - b.firstPurchaseDate.getTime())
      .slice(-12); // Last 12 cohorts

    return apiSuccess({
      summary: {
        totalCustomers,
        newCustomers: newCustomers.length,
        returningCustomers: returningCustomers.length,
        churnedCustomers: churnedCustomers.length,
        retentionRate,
        churnRate,
        avgPurchaseFrequency,
        avgDaysBetweenPurchases: Math.round(avgDaysBetweenPurchases),
        retentionRates,
      },
      cohorts: cohortData.map(cohort => ({
        cohort: cohort.cohort,
        customers: cohort.customers.length,
        retentionByPeriod: cohort.retentionByPeriod,
      })),
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

/**
 * Calculate retention rate for a given period (days)
 */
function calculateRetentionRate(
  customers: Array<{
    firstOrderDate: Date;
    lastOrderDate: Date;
    orders: Array<{ date: Date }>;
  }>,
  days: number
): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const customersWithFirstOrder = customers.filter(c => c.firstOrderDate <= cutoffDate);
  if (customersWithFirstOrder.length === 0) return 0;

  const customersWithRepeatOrder = customersWithFirstOrder.filter(c => {
    const repeatOrders = c.orders.filter(o => {
      const daysSinceFirst = (o.date.getTime() - c.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceFirst <= days && daysSinceFirst > 0;
    });
    return repeatOrders.length > 0;
  });

  return (customersWithRepeatOrder.length / customersWithFirstOrder.length) * 100;
}

