import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';
import { shouldUseDemoData } from '@/lib/automation/demo-mode';
import { getMockDataFromRequest } from '@/lib/mock-data/mock-data-service';

/**
 * GET /api/dashboard/analytics/shipping
 * Get shipping method analytics for the authenticated user's account
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    // Check if account is in demo mode
    const isDemo = await shouldUseDemoData(user.account_id);
    if (isDemo) {
      console.info('✅ [DEBUG] Account in demo mode, returning mock shipping data');
      const mockData = await getMockDataFromRequest('analytics-shipping', user.account_id, request);
      return apiSuccess(mockData);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get shipping method data from analytics.events
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

    // Query shipping-related events using RPC function (required for custom schema)
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: ['shipping_option_selected'],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('❌ [DEBUG] Get shipping analytics error:', eventsError);
      return apiError('Failed to fetch shipping analytics', 500);
    }

    // Debug logging to verify events are being returned
    if (process.env.NODE_ENV === 'development') {
      console.info('✅ [DEBUG] Shipping analytics query:', {
        customerId: user.account_id,
        period,
        dateRange: {
          start: range.start.toISOString(),
          end: range.end.toISOString(),
        },
        eventsFound: events?.length || 0,
      });
    }

    // Aggregate shipping methods
    const shippingMethods: Record<string, {
      method: string;
      count: number;
      totalCost: number;
      avgDays: number;
    }> = {};

    events?.forEach((event: AnalyticsEvent) => {
      const method = event.metadata?.shippingMethod as string || 'Unknown';
      if (!shippingMethods[method]) {
        shippingMethods[method] = {
          method,
          count: 0,
          totalCost: 0,
          avgDays: 0,
        };
      }

      shippingMethods[method].count++;
      if (event.metadata?.shippingCost) {
        shippingMethods[method].totalCost += parseFloat(String(event.metadata.shippingCost));
      }
      if (event.metadata?.deliveryDays) {
        shippingMethods[method].avgDays += parseInt(String(event.metadata.deliveryDays as string));
      }
    });

    // Convert to array and calculate averages
    const shippingData = Object.values(shippingMethods).map((method) => ({
      method: method.method,
      count: method.count,
      avgDays: method.count > 0 ? method.avgDays / method.count : 0,
      avgCost: method.count > 0 ? method.totalCost / method.count : 0,
    }));

    const totalShipments = shippingData.reduce((sum, item) => sum + item.count, 0);
    const avgShippingCost = totalShipments > 0
      ? shippingData.reduce((sum, item) => sum + item.avgCost * item.count, 0) / totalShipments
      : 0;

    return apiSuccess({
      shippingMethods: shippingData,
      totalShipments,
      avgShippingCost: avgShippingCost.toFixed(2),
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

