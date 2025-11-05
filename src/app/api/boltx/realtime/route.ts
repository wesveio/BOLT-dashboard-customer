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

    // Use enhanced predictor for better accuracy
    const predictor = new EnhancedAbandonmentPredictor();

    // Get latest events for the session
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
        p_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: new Date().toISOString(),
      });

    if (eventsError) {
      console.error('❌ [DEBUG] Error fetching events:', eventsError);
      return apiError('Failed to fetch session data', 500);
    }

    // Filter by session ID
    const sessionEvents = events?.filter((e: any) => e.session_id === sessionId) || [];

    if (sessionEvents.length === 0) {
      return apiError('Session not found', 404);
    }

    // Build prediction features
    const features = buildPredictionFeatures(sessionEvents, user.account_id);

    // Get historical data
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
        p_customer_id: user.account_id,
        p_session_id: sessionId,
        p_order_form_id: features.orderFormId,
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

    return apiSuccess({
      prediction,
      timestamp: new Date().toISOString(),
      hasUpdate: hasSignificantChange,
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in realtime API:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * Build prediction features from events
 */
function buildPredictionFeatures(events: any[], customerId: string): PredictionFeatures {
  const sessionStart = new Date(events[0]?.timestamp || Date.now());
  const now = new Date();
  const totalDuration = (now.getTime() - sessionStart.getTime()) / 1000;

  let currentStep = 'cart';
  let stepStartTime = sessionStart.getTime();
  let errorCount = 0;
  let hasReturned = false;
  let orderFormId: string | undefined;

  const stepOrder = ['cart', 'profile', 'shipping', 'payment'];
  const stepsVisited = new Set<string>();

  events.forEach((event) => {
    if (event.step) {
      const step = event.step;
      stepsVisited.add(step);
      
      if (stepOrder.indexOf(step) > stepOrder.indexOf(currentStep)) {
        currentStep = step;
        stepStartTime = new Date(event.timestamp).getTime();
      }
    }

    if (event.event_type === 'error_occurred') {
      errorCount++;
    }

    if (event.event_type === 'checkout_started' && stepsVisited.size > 1) {
      hasReturned = true;
    }

    if (event.order_form_id) {
      orderFormId = event.order_form_id;
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

