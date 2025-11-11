import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { createAIService } from '@/lib/ai/ai-service';
import { EnhancedAbandonmentPredictor } from '@/lib/ai/models/abandonment-predictor';
import { PredictionFeatures } from '@/lib/ai/types';
import { getUserPlan } from '@/lib/api/plan-check';

/**
 * GET /api/boltx/realtime?sessionId=...
 * Get real-time prediction updates (for WebSocket or polling)
 */
export const dynamic = 'force-dynamic';

/**
 * Get allowed origins for CORS
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];

  // In development, always allow localhost on any port
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost', 'http://127.0.0.1', ...envOrigins];
  }

  // In production, require explicit configuration
  return envOrigins.length > 0 ? envOrigins : [];
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
      // Support localhost:* pattern - match any localhost with any port
      if ((allowed.includes('localhost') || allowed.includes('127.0.0.1')) && 
          (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return true;
      }
      return false;
    })
  );

  // Use origin if allowed, otherwise use first allowed origin
  // When using credentials, we cannot use '*' - must use specific origin
  let corsOrigin: string;
  if (isAllowed && origin) {
    corsOrigin = origin;
  } else if (allowedOrigins.length > 0) {
    corsOrigin = allowedOrigins[0];
  } else if (process.env.NODE_ENV === 'development') {
    // In development, use the request origin if available, otherwise allow localhost
    // Cannot use '*' when credentials are included
    corsOrigin = origin || 'http://localhost:3000';
  } else {
    // In production, require explicit configuration
    // Default to first allowed origin or request origin
    corsOrigin = allowedOrigins[0] || origin || 'http://localhost:3000';
  }

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
    'Access-Control-Allow-Credentials': 'true',
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

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.info('[⚡️BoltX Realtime] CORS Debug:', {
      origin,
      corsHeaders,
      allowedOrigins: getAllowedOrigins(),
    });
  }

  try {
    // Get query parameters first
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const vtexAccount = searchParams.get('vtexAccount');

    if (!sessionId) {
      const response = apiError('Session ID is required', 400);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Support both API key (for cross-origin requests) and cookie-based auth
    const apiKey = request.headers.get('X-API-Key');
    const expectedApiKey = process.env.METRICS_API_KEY;
    
    let accountId: string | null = null;

    // Try API key authentication first (for cross-origin requests from checkout)
    if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
      console.info('[⚡️BoltX Realtime] Authenticated via API key');
      
      // For API key auth, try to get account_id from vtexAccount parameter
      // If not provided, we'll try to get it from the events themselves
      if (vtexAccount) {
        const supabaseAdmin = getSupabaseAdmin();
        // Use RPC function to query customer.accounts (PostgREST doesn't expose customer schema directly)
        const { data: accounts, error: accountError } = await supabaseAdmin
          .rpc('get_account_by_vtex_name', { p_vtex_account_name: vtexAccount });
        
        if (accountError) {
          console.error('❌ [DEBUG] Error fetching account by vtex_account_name:', accountError);
        } else if (accounts && accounts.length > 0) {
          accountId = accounts[0].id;
          console.info('✅ [DEBUG] Found account_id for vtex_account_name:', vtexAccount, 'account_id:', accountId);
        } else {
          console.warn('⚠️ [DEBUG] No account found for vtex_account_name:', vtexAccount);
        }
      }
      
      // If no account found from vtexAccount, we'll try to get it from events
      // This will be handled later when we fetch events
    } else {
      // Fall back to cookie-based authentication
      try {
        // Check Enterprise plan access
        const { hasEnterpriseAccess, error: planError } = await getUserPlan();
        if (!hasEnterpriseAccess) {
          const response = apiError(
            planError || 'BoltX is only available on Enterprise plan. Please upgrade to access this feature.',
            403
          );
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }

        const authResult = await getAuthenticatedUser();
        accountId = authResult.user.account_id ?? null;

        if (!accountId) {
          const response = apiError('User account not found', 404);
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }
      } catch (authError) {
        // If cookie auth fails and no API key provided, return 401
        if (!apiKey) {
          const response = apiError('Authentication required. Provide X-API-Key header or valid session cookie.', 401);
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }
        // If API key was provided but invalid, return 401
        const response = apiError('Invalid API key', 401);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
    }

    const supabaseAdmin = getSupabaseAdmin();
    const aiService = createAIService();

    if (!aiService) {
      const response = apiError('BoltX AI service is not available', 503);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Use the account_id we determined (from user or API key lookup)
    const customerId = accountId;
    
    // If no customerId, return error with helpful message
    if (!customerId) {
      const errorMessage = apiKey && expectedApiKey && apiKey === expectedApiKey
        ? 'Customer account ID not found. For API key authentication, provide vtexAccount query parameter (e.g., ?sessionId=...&vtexAccount=your-account).'
        : 'Customer account ID not found';
      const response = apiError(errorMessage, 400);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Use enhanced predictor for better accuracy
    const predictor = new EnhancedAbandonmentPredictor();

    // Get latest events for the session
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: customerId,
        p_event_types: [
          'checkout_start',
          'checkout_started',
          'step_viewed',
          'step_completed',
          'step_abandoned',
          'error_occurred',
          'checkout_complete',
          'order_confirmed',
        ],
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: new Date().toISOString(),
      });

    if (eventsError) {
      console.error('❌ [DEBUG] Error fetching events:', eventsError);
      const response = apiError('Failed to fetch session data', 500);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Filter by session ID
    const sessionEvents = events?.filter((e: any) => e.session_id === sessionId) || [];

    if (sessionEvents.length === 0) {
      const response = apiError('Session not found', 404);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Extract orderFormId from events
    const orderFormId = sessionEvents.find((e: any) => e.order_form_id)?.order_form_id;

    // Build prediction features
    const features = buildPredictionFeatures(sessionEvents);

    // Get historical data
    const historicalData = await getHistoricalData(supabaseAdmin, customerId, sessionId);

    // Merge features with historical data
    const fullFeatures: PredictionFeatures = {
      ...features,
      historicalAbandonments: historicalData.abandonments,
      avgCheckoutTime: historicalData.avgCheckoutTime,
      historicalConversionRate: historicalData.conversionRate,
    };

    // Generate prediction using enhanced predictor with session context
    const prediction = predictor.predict(fullFeatures, sessionId);

    // Get latest stored prediction for comparison
    const { data: latestPrediction } = await supabaseAdmin
      .rpc('get_latest_prediction', {
        p_session_id: sessionId,
      });

    // Check if prediction has changed significantly
    const hasSignificantChange = latestPrediction && latestPrediction.length > 0
      ? Math.abs(prediction.riskScore - latestPrediction[0].risk_score) > 10
      : true;

    // Store prediction if significant change or first prediction
    if (hasSignificantChange || !latestPrediction || latestPrediction.length === 0) {
      await supabaseAdmin.rpc('insert_ai_prediction', {
        p_customer_id: customerId,
        p_session_id: sessionId,
        p_order_form_id: orderFormId || null,
        p_prediction_type: 'abandonment',
        p_risk_score: prediction.riskScore,
        p_risk_level: prediction.riskLevel,
        p_confidence: prediction.confidence,
        p_factors: prediction.factors,
        p_recommendations: prediction.recommendations,
        p_intervention_suggested: prediction.interventionSuggested,
        p_intervention_type: prediction.interventionType || null,
      });
    }

    const response = apiSuccess({
      prediction,
      timestamp: new Date().toISOString(),
      hasUpdate: hasSignificantChange,
    });
    // Add CORS headers to success response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('❌ [DEBUG] Error in realtime API:', error);
    const response = apiError('Internal server error', 500);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

/**
 * Build prediction features from events
 */
function buildPredictionFeatures(events: any[]): PredictionFeatures {
  // Sort events by timestamp to ensure chronological processing
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = new Date(a.timestamp || 0).getTime();
    const timeB = new Date(b.timestamp || 0).getTime();
    return timeA - timeB;
  });

  const sessionStart = new Date(sortedEvents[0]?.timestamp || Date.now());
  const now = new Date();
  const totalDuration = (now.getTime() - sessionStart.getTime()) / 1000;

  let currentStep = 'cart';
  let stepStartTime = sessionStart.getTime();
  let errorCount = 0;
  let hasReturned = false;

  const stepOrder = ['cart', 'login', 'profile', 'shipping', 'payment'];
  const stepsVisited = new Set<string>();

  sortedEvents.forEach((event) => {
    // Update currentStep when step_viewed event occurs (most recent step_viewed is the current step)
    if (event.event_type === 'step_viewed' && event.step) {
      const step = event.step;
      currentStep = step;
      stepStartTime = new Date(event.timestamp).getTime();
      stepsVisited.add(step);
    } else if (event.step) {
      // Track all steps visited for hasReturned calculation
      const step = event.step;
      stepsVisited.add(step);
    }

    if (event.event_type === 'error_occurred') {
      errorCount++;
    }

    if (event.event_type === 'checkout_started' && stepsVisited.size > 1) {
      hasReturned = true;
    }
  });

  const currentStepIndex = stepOrder.indexOf(currentStep);
  const stepProgress = stepOrder.length > 0 ? (currentStepIndex + 1) / stepOrder.length : 0.5;
  const stepDuration = (now.getTime() - stepStartTime) / 1000;

  const typicalCheckoutTime = 180;
  const timeExceeded = typicalCheckoutTime > 0 ? totalDuration / typicalCheckoutTime : 0;

  const deviceType = events[0]?.metadata?.deviceType ||
    events[0]?.metadata?.device_type ||
    undefined;

  const location = events[0]?.metadata?.location || undefined;

  return {
    timeExceeded,
    errorCount,
    currentStep,
    stepDuration,
    totalDuration,
    hasReturned,
    stepProgress,
    deviceType,
    location,
  };
}

/**
 * Get historical data for user
 */
async function getHistoricalData(
  supabase: any,
  customerId: string,
  sessionId: string
): Promise<{
  abandonments: number;
  avgCheckoutTime: number;
  conversionRate: number;
}> {
  try {
    const { data: previousSessions } = await supabase
      .rpc('get_analytics_events_by_types', {
        p_customer_id: customerId,
        p_event_types: [
          'checkout_start',
          'checkout_started',
          'checkout_complete',
          'order_confirmed',
          'step_abandoned',
        ],
        p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: new Date().toISOString(),
      });

    if (!previousSessions || previousSessions.length === 0) {
      return {
        abandonments: 0,
        avgCheckoutTime: 180,
        conversionRate: 0.5,
      };
    }

    const filteredSessions = previousSessions.filter((e: any) => e.session_id !== sessionId);

    if (filteredSessions.length === 0) {
      return {
        abandonments: 0,
        avgCheckoutTime: 180,
        conversionRate: 0.5,
      };
    }

    const sessions = new Set(filteredSessions.map((e: any) => e.session_id));
    let completed = 0;
    let abandoned = 0;
    const checkoutTimes: number[] = [];

    sessions.forEach((sid) => {
      const sessionEvents = filteredSessions.filter((e: any) => e.session_id === sid);
      const startEvent = sessionEvents.find((e: any) =>
        e.event_type === 'checkout_start' || e.event_type === 'checkout_started'
      );
      const completeEvent = sessionEvents.find((e: any) =>
        e.event_type === 'checkout_complete' || e.event_type === 'order_confirmed'
      );
      const abandonEvent = sessionEvents.find((e: any) =>
        e.event_type === 'step_abandoned'
      );

      if (completeEvent && startEvent) {
        completed++;
        const duration = (new Date(completeEvent.timestamp).getTime() -
          new Date(startEvent.timestamp).getTime()) / 1000;
        if (duration > 0) {
          checkoutTimes.push(duration);
        }
      } else if (abandonEvent) {
        abandoned++;
      }
    });

    const totalSessions = sessions.size;
    const conversionRate = totalSessions > 0 ? completed / totalSessions : 0;
    const avgCheckoutTime = checkoutTimes.length > 0
      ? checkoutTimes.reduce((a, b) => a + b, 0) / checkoutTimes.length
      : 180;

    return {
      abandonments: abandoned,
      avgCheckoutTime,
      conversionRate,
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error getting historical data:', error);
    return {
      abandonments: 0,
      avgCheckoutTime: 180,
      conversionRate: 0.5,
    };
  }
}

