import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';

// Ensure this route is handled at runtime (not static)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/analytics/events
 * Get analytics events with summary metrics and paginated event list
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const eventType = searchParams.get('event_type') || null;
    const category = searchParams.get('category') || null;
    const step = searchParams.get('step') || null;

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

    // Build event types filter
    const eventTypes = eventType ? [eventType] : null;
    const categories = category ? [category] : null;

    // Debug logging
    console.log('🔍 [DEBUG] Analytics events query:', {
      customer_id: user.account_id,
      start_date: range.start.toISOString(),
      end_date: range.end.toISOString(),
      period,
      event_type: eventType,
      category,
    });

    // Query all events for summary metrics
    // First try with customer_id filter
    let allEvents: any[] | null = null;
    let allEventsError: any = null;

    ({ data: allEvents, error: allEventsError } = await supabaseAdmin
      .rpc('get_analytics_events', {
        p_customer_id: user.account_id,
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
        p_event_types: eventTypes,
        p_categories: categories,
      }));

    if (allEventsError) {
      console.error('❌ [DEBUG] Get analytics events error:', allEventsError);
      return apiError('Failed to fetch analytics events', 500);
    }

    console.log('✅ [DEBUG] Retrieved events count with customer_id:', allEvents?.length || 0);

    // Ensure allEvents is an array (default to empty array if null)
    allEvents = allEvents || [];

    // Filter by step if provided (since RPC doesn't support step filtering directly)
    let filteredEvents = allEvents;
    if (step) {
      filteredEvents = filteredEvents.filter((e) => e.step === step);
    }

    // Calculate summary metrics
    const totalEvents = filteredEvents.length;
    const uniqueSessions = new Set(filteredEvents.map((e) => e.session_id)).size;

    // Events by category
    const eventsByCategory: Record<string, number> = {
      user_action: 0,
      api_call: 0,
      metric: 0,
      error: 0,
    };

    filteredEvents.forEach((event) => {
      if (event.category in eventsByCategory) {
        eventsByCategory[event.category]++;
      }
    });

    // Events by type (top 10)
    const eventsByType: Record<string, number> = {};
    filteredEvents.forEach((event) => {
      eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
    });

    const topEventTypes = Object.entries(eventsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    // Error count
    const errorCount = eventsByCategory.error || 0;

    // Events are already sorted DESC by the database query
    // Paginate events
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    const totalPages = Math.ceil(totalEvents / limit);

    return apiSuccess({
      summary: {
        totalEvents,
        uniqueSessions,
        eventsByCategory,
        topEventTypes,
        errorCount,
      },
      events: paginatedEvents.map((event) => ({
        id: event.id,
        session_id: event.session_id,
        order_form_id: event.order_form_id,
        event_type: event.event_type,
        category: event.category,
        step: event.step,
        metadata: event.metadata,
        timestamp: event.timestamp,
      })),
      pagination: {
        page,
        limit,
        totalEvents,
        totalPages,
        hasMore: page < totalPages,
      },
      period,
      dateRange: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      },
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

