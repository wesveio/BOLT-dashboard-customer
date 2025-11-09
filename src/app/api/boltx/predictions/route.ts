import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { createAIService } from '@/lib/ai/ai-service';
import { EnhancedAbandonmentPredictor } from '@/lib/ai/models/abandonment-predictor';
import { PredictionFeatures } from '@/lib/ai/types';
import { getUserPlan } from '@/lib/api/plan-check';

/**
 * GET /api/boltx/predictions?sessionId=...
 * Get real-time predictions for a checkout session
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check Enterprise plan access
    const { hasEnterpriseAccess, error: planError } = await getUserPlan();
    if (!hasEnterpriseAccess) {
      return apiError(
        planError || 'BoltX is only available on Enterprise plan. Please upgrade to access this feature.',
        403
      );
    }

    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return apiError('Session ID is required', 400);
    }

    const supabaseAdmin = getSupabaseAdmin();
    const aiService = createAIService();

    if (!aiService) {
      return apiError('BoltX AI service is not available', 503);
    }

    // Use enhanced predictor if available
    const predictor = new EnhancedAbandonmentPredictor();

    // Get session events to build features
    // Use RPC function if available, otherwise query directly
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
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
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        p_end_date: new Date().toISOString(),
      })
      .then((result) => {
        // Filter by session_id in application code
        if (result.data) {
          return {
            ...result,
            data: result.data.filter((e: any) => e.session_id === sessionId),
          };
        }
        return result;
      });

    if (eventsError) {
      console.error('❌ [DEBUG] Error fetching events:', eventsError);
      return apiError('Failed to fetch session data', 500);
    }

    if (!events || events.length === 0) {
      return apiError('Session not found', 404);
    }

    // Extract orderFormId from events
    const orderFormId = events.find((e: any) => e.order_form_id)?.order_form_id;

    // Build prediction features from events
    const features = buildPredictionFeatures(events);

    // Get historical data if available
    const historicalData = await getHistoricalData(supabaseAdmin, user.account_id, sessionId);

    // Merge features with historical data
    const fullFeatures: PredictionFeatures = {
      ...features,
      historicalAbandonments: historicalData.abandonments,
      avgCheckoutTime: historicalData.avgCheckoutTime,
      historicalConversionRate: historicalData.conversionRate,
    };

    // Generate prediction using enhanced predictor with session context
    const prediction = predictor.predict(fullFeatures, sessionId);

    // Store prediction in database
    await supabaseAdmin.rpc('insert_ai_prediction', {
      p_customer_id: user.account_id,
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

    return apiSuccess(prediction);
  } catch (error) {
    console.error('❌ [DEBUG] Error in predictions API:', error);
    return apiError('Internal server error', 500);
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

  // Calculate time exceeded (assuming typical checkout is 3 minutes)
  const typicalCheckoutTime = 180; // 3 minutes
  const timeExceeded = typicalCheckoutTime > 0 ? totalDuration / typicalCheckoutTime : 0;

  // Extract device type from metadata
  const deviceType = events[0]?.metadata?.deviceType ||
    events[0]?.metadata?.device_type ||
    undefined;

  // Extract location from metadata
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
    // Get previous sessions for this customer using RPC
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
        p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        p_end_date: new Date().toISOString(),
      });

    if (!previousSessions || previousSessions.length === 0) {
      return {
        abandonments: 0,
        avgCheckoutTime: 180, // Default 3 minutes
        conversionRate: 0.5, // Default 50%
      };
    }

    // Filter out current session
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

