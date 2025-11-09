import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

/**
 * GET /api/dashboard/analytics/micro-conversions
 * Get micro-conversion rates for each checkout step
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get micro-conversion data from analytics.events
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

    // Query all relevant events for micro-conversions
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: [
          'checkout_start',
          'cart_view',
          'profile_step',
          'profile_data_updated',
          'shipping_step',
          'address_validated',
          'shipping_option_selected',
          'payment_step',
          'payment_method_selected',
          'checkout_complete',
          'order_confirmed',
        ],
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('Get micro-conversions error:', eventsError);
      return apiError('Failed to fetch micro-conversions data', 500);
    }

    // Group events by session
    const sessions: Record<string, {
      cart: boolean;
      profileViewed: boolean;
      profileCompleted: boolean;
      shippingViewed: boolean;
      addressValidated: boolean;
      shippingSelected: boolean;
      paymentViewed: boolean;
      paymentSelected: boolean;
      completed: boolean;
    }> = {};

    // Initialize session tracking
    events?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          cart: false,
          profileViewed: false,
          profileCompleted: false,
          shippingViewed: false,
          addressValidated: false,
          shippingSelected: false,
          paymentViewed: false,
          paymentSelected: false,
          completed: false,
        };
      }

      const session = sessions[sessionId];

      switch (event.event_type) {
        case 'checkout_start':
        case 'cart_view':
          session.cart = true;
          break;
        case 'profile_step':
          session.profileViewed = true;
          break;
        case 'profile_data_updated':
          session.profileCompleted = true;
          break;
        case 'shipping_step':
          session.shippingViewed = true;
          break;
        case 'address_validated':
          session.addressValidated = true;
          break;
        case 'shipping_option_selected':
          session.shippingSelected = true;
          break;
        case 'payment_step':
          session.paymentViewed = true;
          break;
        case 'payment_method_selected':
          session.paymentSelected = true;
          break;
        case 'checkout_complete':
        case 'order_confirmed':
          session.completed = true;
          break;
      }
    });

    // Calculate micro-conversion rates
    const totalSessions = Object.keys(sessions).length;
    
    if (totalSessions === 0) {
      return apiSuccess({
        microConversions: [],
        summary: {
          totalSessions: 0,
        },
        period,
      });
    }

    // Count conversions for each step
    const microConversions = [
      {
        step: 'cart',
        label: 'Cart View',
        reached: totalSessions,
        completed: totalSessions,
        conversionRate: 100,
        description: 'Users who started checkout',
      },
      {
        step: 'profile_viewed',
        label: 'Profile Viewed',
        reached: Object.values(sessions).filter(s => s.profileViewed).length,
        completed: Object.values(sessions).filter(s => s.profileViewed).length,
        conversionRate: (Object.values(sessions).filter(s => s.profileViewed).length / totalSessions) * 100,
        description: 'Users who viewed profile step',
      },
      {
        step: 'profile_completed',
        label: 'Profile Completed',
        reached: Object.values(sessions).filter(s => s.profileCompleted).length,
        completed: Object.values(sessions).filter(s => s.profileCompleted).length,
        conversionRate: (Object.values(sessions).filter(s => s.profileCompleted).length / totalSessions) * 100,
        description: 'Users who completed profile information',
      },
      {
        step: 'shipping_viewed',
        label: 'Shipping Viewed',
        reached: Object.values(sessions).filter(s => s.shippingViewed).length,
        completed: Object.values(sessions).filter(s => s.shippingViewed).length,
        conversionRate: (Object.values(sessions).filter(s => s.shippingViewed).length / totalSessions) * 100,
        description: 'Users who viewed shipping step',
      },
      {
        step: 'address_validated',
        label: 'Address Validated',
        reached: Object.values(sessions).filter(s => s.addressValidated).length,
        completed: Object.values(sessions).filter(s => s.addressValidated).length,
        conversionRate: (Object.values(sessions).filter(s => s.addressValidated).length / totalSessions) * 100,
        description: 'Users who validated their address',
      },
      {
        step: 'shipping_selected',
        label: 'Shipping Selected',
        reached: Object.values(sessions).filter(s => s.shippingSelected).length,
        completed: Object.values(sessions).filter(s => s.shippingSelected).length,
        conversionRate: (Object.values(sessions).filter(s => s.shippingSelected).length / totalSessions) * 100,
        description: 'Users who selected shipping option',
      },
      {
        step: 'payment_viewed',
        label: 'Payment Viewed',
        reached: Object.values(sessions).filter(s => s.paymentViewed).length,
        completed: Object.values(sessions).filter(s => s.paymentViewed).length,
        conversionRate: (Object.values(sessions).filter(s => s.paymentViewed).length / totalSessions) * 100,
        description: 'Users who viewed payment step',
      },
      {
        step: 'payment_selected',
        label: 'Payment Selected',
        reached: Object.values(sessions).filter(s => s.paymentSelected).length,
        completed: Object.values(sessions).filter(s => s.paymentSelected).length,
        conversionRate: (Object.values(sessions).filter(s => s.paymentSelected).length / totalSessions) * 100,
        description: 'Users who selected payment method',
      },
      {
        step: 'completed',
        label: 'Order Completed',
        reached: Object.values(sessions).filter(s => s.completed).length,
        completed: Object.values(sessions).filter(s => s.completed).length,
        conversionRate: (Object.values(sessions).filter(s => s.completed).length / totalSessions) * 100,
        description: 'Users who completed checkout',
      },
    ];

    // Calculate drop-off rates (conversion loss between steps)
    const dropOffs = microConversions.map((current, index) => {
      if (index === 0) {
        return { step: current.step, dropOff: 0 };
      }
      const previous = microConversions[index - 1];
      const dropOff = previous.completed - current.reached;
      return {
        step: current.step,
        dropOff: Math.max(0, dropOff),
        dropOffRate: previous.completed > 0
          ? (dropOff / previous.completed) * 100
          : 0,
      };
    });

    return apiSuccess({
      microConversions,
      dropOffs,
      summary: {
        totalSessions,
        overallConversionRate: microConversions[microConversions.length - 1].conversionRate,
      },
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

