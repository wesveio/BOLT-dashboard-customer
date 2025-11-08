import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';
import type { ModelMetrics } from '@/lib/ai/models/abandonment-predictor';

/**
 * GET /api/boltx/model-metrics
 * Get model performance metrics (accuracy, precision, recall, f1Score)
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

    const supabaseAdmin = getSupabaseAdmin();

    // Get all abandonment predictions for this customer
    // Query directly from analytics schema using schema-qualified table
    const { data: predictions, error: predictionsError } = await supabaseAdmin
      .from('analytics.ai_predictions')
      .select('id, session_id, risk_score, risk_level, created_at')
      .eq('customer_id', user.account_id)
      .eq('prediction_type', 'abandonment')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (predictionsError) {
      console.error('❌ [DEBUG] Error fetching predictions:', predictionsError);
      return apiError('Failed to fetch predictions', 500);
    }

    if (!predictions || predictions.length === 0) {
      // Return default metrics if no predictions
      return apiSuccess({
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        lastTrained: null,
        trainingSize: 0,
      });
    }

    // Get session outcomes by checking events
    const sessionIds = [...new Set(predictions.map((p) => p.session_id))];
    
    // Get events for these sessions to determine outcomes
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('get_analytics_events_by_types', {
        p_customer_id: user.account_id,
        p_event_types: [
          'checkout_complete',
          'order_confirmed',
          'step_abandoned',
        ],
        p_start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
        p_end_date: new Date().toISOString(),
      });

    if (eventsError) {
      console.error('❌ [DEBUG] Error fetching events:', eventsError);
      // Continue with partial data
    }

    // Build session outcome map
    const sessionOutcomes = new Map<string, 'completed' | 'abandoned' | 'unknown'>();
    
    if (events) {
      events.forEach((event: any) => {
        const sessionId = event.session_id;
        if (!sessionOutcomes.has(sessionId)) {
          if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
            sessionOutcomes.set(sessionId, 'completed');
          } else if (event.event_type === 'step_abandoned') {
            sessionOutcomes.set(sessionId, 'abandoned');
          }
        } else {
          // If already marked as completed, keep it
          if (sessionOutcomes.get(sessionId) === 'completed') {
            return;
          }
          // Otherwise update based on new event
          if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
            sessionOutcomes.set(sessionId, 'completed');
          }
        }
      });
    }

    // Calculate metrics
    let truePositives = 0; // Predicted high risk (>=50), actually abandoned
    let falsePositives = 0; // Predicted high risk (>=50), actually completed
    let trueNegatives = 0; // Predicted low risk (<50), actually completed
    let falseNegatives = 0; // Predicted low risk (<50), actually abandoned

    // Use the latest prediction per session
    const latestPredictions = new Map<string, typeof predictions[0]>();
    predictions.forEach((pred) => {
      const existing = latestPredictions.get(pred.session_id);
      if (!existing || new Date(pred.created_at) > new Date(existing.created_at)) {
        latestPredictions.set(pred.session_id, pred);
      }
    });

    latestPredictions.forEach((prediction, sessionId) => {
      const outcome = sessionOutcomes.get(sessionId) || 'unknown';
      
      // Skip if outcome is unknown
      if (outcome === 'unknown') {
        return;
      }

      const isHighRisk = prediction.risk_score >= 50;
      const actuallyAbandoned = outcome === 'abandoned';

      if (isHighRisk && actuallyAbandoned) {
        truePositives++;
      } else if (isHighRisk && !actuallyAbandoned) {
        falsePositives++;
      } else if (!isHighRisk && !actuallyAbandoned) {
        trueNegatives++;
      } else if (!isHighRisk && actuallyAbandoned) {
        falseNegatives++;
      }
    });

    const total = truePositives + falsePositives + trueNegatives + falseNegatives;

    // Calculate metrics
    const accuracy = total > 0 ? (truePositives + trueNegatives) / total : 0;
    const precision = truePositives + falsePositives > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;
    const recall = truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;
    const f1Score = precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

    // Get the most recent prediction timestamp as lastTrained
    const lastTrained = predictions.length > 0
      ? new Date(predictions[0].created_at)
      : null;

    const metrics: ModelMetrics = {
      accuracy,
      precision,
      recall,
      f1Score,
      lastTrained: lastTrained || new Date(),
      trainingSize: total,
    };

    console.info('✅ [DEBUG] Model metrics calculated:', {
      accuracy: (accuracy * 100).toFixed(2) + '%',
      precision: (precision * 100).toFixed(2) + '%',
      recall: (recall * 100).toFixed(2) + '%',
      f1Score: (f1Score * 100).toFixed(2) + '%',
      trainingSize: total,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
    });

    return apiSuccess(metrics);
  } catch (error) {
    console.error('❌ [DEBUG] Error in model-metrics API:', error);
    return apiError('Internal server error', 500);
  }
}

