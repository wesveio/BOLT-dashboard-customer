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


/**
 * Get allowed origins for CORS
 */
function getAllowedOrigins(): string[] {
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];

  // In development, allow localhost on any port
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost', 'http://127.0.0.1', ...allowedOrigins];
  }

  return allowedOrigins;
}

/**
 * Get CORS headers
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();

  // Check if origin is allowed (supports wildcards like localhost:*)
  const isAllowed = origin && (
    allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (origin === allowed) return true;
      // Support localhost:* pattern
      if (allowed.includes('localhost') && origin.includes('localhost')) {
        return true;
      }
      return false;
    })
  );

  const corsOrigin = isAllowed ? origin : allowedOrigins[0] || '*';

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle OPTIONS request (preflight)
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * POST /api/bolt/metrics/events
 * Receives metrics/events from checkout and stores them in analytics.events table
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Validate API Key
    const apiKey = request.headers.get('X-API-Key');
    const expectedApiKey = process.env.METRICS_API_KEY;

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('‼️ [DEBUG] Metrics API Key Check:', {
        hasReceivedKey: !!apiKey,
        receivedKeyLength: apiKey?.length || 0,
        hasExpectedKey: !!expectedApiKey,
        expectedKeyLength: expectedApiKey?.length || 0,
        keysMatch: apiKey === expectedApiKey,
        origin: request.headers.get('origin'),
      });
    }

    if (!expectedApiKey) {
      console.error('❌ [ERROR] METRICS_API_KEY not configured in server environment');
      return NextResponse.json(
        { error: 'Server configuration error' },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    if (!apiKey) {
      console.warn('⚠️ [WARN] No X-API-Key header provided');
      return NextResponse.json(
        { error: 'Unauthorized: API key is required' },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    if (apiKey !== expectedApiKey) {
      console.warn('⚠️ [WARN] API key mismatch');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key' },
        {
          status: 401,
          headers: corsHeaders,
        }
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
        {
          status: 400,
          headers: corsHeaders,
        }
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
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Extract unique vtex_account_name values from events
    const vtexAccountNames = new Set<string>();
    events.forEach((event) => {
      const vtexAccountName = event.metadata?.vtex_account_name as string | undefined;
      if (vtexAccountName && typeof vtexAccountName === 'string') {
        vtexAccountNames.add(vtexAccountName);
      }
    });

    // Look up customer_id for each unique vtex_account_name
    const customerIdMap = new Map<string, string | null>();

    if (vtexAccountNames.size > 0) {
      for (const vtexAccountName of Array.from(vtexAccountNames)) {
        try {
          const { data: accounts, error: lookupError } = await supabaseAdmin
            .rpc('get_account_by_vtex_name', { p_vtex_account_name: vtexAccountName });

          if (lookupError) {
            console.warn('⚠️ [DEBUG] Failed to lookup customer_id for vtex_account_name:', vtexAccountName, lookupError);
            customerIdMap.set(vtexAccountName, null);
          } else if (accounts && accounts.length > 0 && accounts[0]?.id) {
            customerIdMap.set(vtexAccountName, accounts[0].id);
            console.info('✅ [DEBUG] Found customer_id for vtex_account_name:', vtexAccountName, 'customer_id:', accounts[0].id);
          } else {
            console.warn('⚠️ [DEBUG] No account found for vtex_account_name:', vtexAccountName);
            customerIdMap.set(vtexAccountName, null);
          }
        } catch (error) {
          console.error('❌ [DEBUG] Error looking up customer_id for vtex_account_name:', vtexAccountName, error);
          customerIdMap.set(vtexAccountName, null);
        }
      }
    }

    // Prepare events for insertion as JSONB
    const eventsJson = events.map((event) => {
      // Extract step from top level or metadata (step may be in metadata from useEventTracker)
      const step = event.step || (event.metadata?.step as string) || null;

      // Extract vtex_account_name and get customer_id
      const vtexAccountName = event.metadata?.vtex_account_name as string | undefined;
      const customerId = vtexAccountName ? customerIdMap.get(vtexAccountName) || null : null;

      // Remove step from metadata to avoid duplication (it's now in the step column)
      const { step: _, ...metadataWithoutStep } = event.metadata || {};

      // Add customer_id to metadata so the RPC function can extract it
      const metadata = {
        ...metadataWithoutStep,
        ...(customerId && { customer_id: customerId }),
      };

      return {
        session_id: event.sessionId,
        order_form_id: event.orderFormId || null,
        event_type: event.type,
        category: event.category,
        step,
        metadata,
        timestamp: event.timestamp || new Date().toISOString(),
      };
    });

    // Insert events using RPC function (required for analytics schema)
    const { data, error } = await supabaseAdmin
      .rpc('insert_analytics_events', {
        p_events: eventsJson,
      });

    if (error) {
      console.error('Failed to insert events:', error);
      return NextResponse.json(
        { error: 'Failed to store events', details: error.message },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      eventIds: data?.map((e: { id: string }) => e.id) || [],
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error processing events:', error);

    // Don't expose internal error details
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

