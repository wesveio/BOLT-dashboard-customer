import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Event payload interface matching TrackedEvent structure
 */
interface EventPayload {
  id: string;
  type: string;
  category: 'user_action' | 'api_call' | 'metric' | 'error';
  timestamp: string;
  sessionId: string;
  orderFormId?: string;
  step?: string;
  metadata?: Record<string, any>;
}

interface BatchEventsPayload {
  events: EventPayload[];
}

/**
 * POST /api/bolt/metrics/events
 * Receives metrics/events from checkout and stores them in analytics.events table
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API Key
    const apiKey = request.headers.get('X-API-Key');
    const expectedApiKey = process.env.METRICS_API_KEY;

    if (!expectedApiKey) {
      console.error('METRICS_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Support both single event and batch of events
    const events: EventPayload[] = Array.isArray(body) 
      ? body 
      : body.events 
        ? body.events 
        : [body];

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: 'No events provided' },
        { status: 400 }
      );
    }

    // Validate events structure
    const validationErrors: string[] = [];
    events.forEach((event, index) => {
      if (!event.id) {
        validationErrors.push(`Event ${index}: missing id`);
      }
      if (!event.type) {
        validationErrors.push(`Event ${index}: missing type`);
      }
      if (!event.category || !['user_action', 'api_call', 'metric', 'error'].includes(event.category)) {
        validationErrors.push(`Event ${index}: invalid category`);
      }
      if (!event.timestamp) {
        validationErrors.push(`Event ${index}: missing timestamp`);
      }
      if (!event.sessionId) {
        validationErrors.push(`Event ${index}: missing sessionId`);
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Prepare events for insertion
    const insertData = events.map((event) => ({
      session_id: event.sessionId,
      order_form_id: event.orderFormId || null,
      customer_id: null, // Will be populated later if customer is identified
      event_type: event.type,
      category: event.category,
      step: event.step || null,
      metadata: event.metadata || {},
      timestamp: event.timestamp || new Date().toISOString(),
    }));

    // Insert events into analytics.events table
    const { data, error } = await supabaseAdmin
      .from('analytics.events')
      .insert(insertData)
      .select('id');

    if (error) {
      console.error('Failed to insert events:', error);
      return NextResponse.json(
        { error: 'Failed to store events', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      eventIds: data?.map((e) => e.id) || [],
    });
  } catch (error) {
    console.error('Error processing events:', error);
    
    // Don't expose internal error details
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

