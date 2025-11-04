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
 * Extract discount amount from event metadata
 */
function extractDiscount(event: AnalyticsEvent): number {
  const metadata = event.metadata || {};
  const discountValue =
    metadata.discountAmount ??
    metadata.discountValue ??
    metadata.metricValue ?? // discount_applied uses metricValue
    null;

  if (discountValue === null || discountValue === undefined) {
    return 0;
  }

  const numValue = typeof discountValue === 'number'
    ? discountValue
    : parseFloat(String(discountValue));

  if (isNaN(numValue) || numValue < 0) {
    return 0;
  }

  return numValue;
}

/**
 * GET /api/dashboard/analytics/coupons
 * Get coupon/discount analytics for the authenticated user's account
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get coupon/discount data from analytics.events
    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Calculate date range
    const range = getDateRange(period);

    // Query discount-related events using RPC function
    const { data: discountEvents, error: discountError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['discount_applied'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (discountError) {
      console.error('Get discount events error:', discountError);
      return apiError('Failed to fetch discount events', 500);
    }

    // Query checkout_complete events to calculate revenue with/without discounts
    const { data: checkoutEvents, error: checkoutError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['checkout_complete', 'order_confirmed'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (checkoutError) {
      console.error('Get checkout events error:', checkoutError);
      return apiError('Failed to fetch checkout events', 500);
    }

    // Aggregate coupons/discounts
    const coupons: Record<string, {
      code: string;
      count: number;
      totalDiscount: number;
      avgDiscount: number;
      revenue: number;
      orders: number;
    }> = {};

    // Track sessions with discounts
    const sessionsWithDiscount = new Set<string>();
    const discountBySession: Record<string, number> = {};

    discountEvents?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      const discount = extractDiscount(event);
      const couponCode = (event.metadata?.couponCode as string) || 
                         (event.metadata?.discountCode as string) || 
                         'Unknown';
      
      if (!coupons[couponCode]) {
        coupons[couponCode] = {
          code: couponCode,
          count: 0,
          totalDiscount: 0,
          avgDiscount: 0,
          revenue: 0,
          orders: 0,
        };
      }

      coupons[couponCode].count++;
      coupons[couponCode].totalDiscount += discount;
      
      if (discount > 0) {
        sessionsWithDiscount.add(sessionId);
        discountBySession[sessionId] = (discountBySession[sessionId] || 0) + discount;
      }
    });

    // Calculate average discount per coupon
    Object.values(coupons).forEach((coupon) => {
      coupon.avgDiscount = coupon.count > 0 ? coupon.totalDiscount / coupon.count : 0;
    });

    // Match checkout events with discounts to calculate revenue
    checkoutEvents?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      const revenue = extractRevenue(event);
      const hasDiscount = sessionsWithDiscount.has(sessionId);
      
      if (hasDiscount && revenue > 0) {
        // Find which coupon was used in this session
        const sessionDiscountEvents = discountEvents?.filter(
          (e: AnalyticsEvent) => e.session_id === sessionId
        ) || [];
        
        sessionDiscountEvents.forEach((discountEvent: AnalyticsEvent) => {
          const couponCode = (discountEvent.metadata?.couponCode as string) || 
                             (discountEvent.metadata?.discountCode as string) || 
                             'Unknown';
          if (coupons[couponCode]) {
            coupons[couponCode].revenue += revenue;
            coupons[couponCode].orders++;
          }
        });
      }
    });

    // Calculate totals
    const totalDiscounts = discountEvents?.length || 0;
    const totalDiscountAmount = Object.values(coupons).reduce(
      (sum, coupon) => sum + coupon.totalDiscount,
      0
    );
    const avgDiscountAmount = totalDiscounts > 0
      ? totalDiscountAmount / totalDiscounts
      : 0;

    // Calculate revenue with and without discounts
    let revenueWithDiscount = 0;
    let revenueWithoutDiscount = 0;
    let ordersWithDiscount = 0;
    let ordersWithoutDiscount = 0;

    checkoutEvents?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      const revenue = extractRevenue(event);
      
      if (revenue > 0) {
        if (sessionsWithDiscount.has(sessionId)) {
          revenueWithDiscount += revenue;
          ordersWithDiscount++;
        } else {
          revenueWithoutDiscount += revenue;
          ordersWithoutDiscount++;
        }
      }
    });

    const couponUsageRate = checkoutEvents && checkoutEvents.length > 0
      ? (ordersWithDiscount / checkoutEvents.length) * 100
      : 0;

    // Convert to array and sort by usage
    const couponData = Object.values(coupons)
      .map((coupon) => ({
        code: coupon.code,
        count: coupon.count,
        totalDiscount: coupon.totalDiscount,
        avgDiscount: coupon.avgDiscount,
        revenue: coupon.revenue,
        orders: coupon.orders,
        avgOrderValue: coupon.orders > 0 ? coupon.revenue / coupon.orders : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return apiSuccess({
      coupons: couponData,
      summary: {
        totalDiscounts,
        totalDiscountAmount,
        avgDiscountAmount,
        couponUsageRate,
        revenueWithDiscount,
        revenueWithoutDiscount,
        ordersWithDiscount,
        ordersWithoutDiscount,
      },
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

