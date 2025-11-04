import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';
import { predictAbandonment, getTypicalCheckoutDuration, type AbandonmentRiskFactors } from '@/utils/dashboard/abandonment-predictor';

/**
 * GET /api/dashboard/analytics/abandonment-prediction
 * Get abandonment prediction analytics and risk scores
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get('period'));

    // Calculate date range
    const range = getDateRange(period);

    // Query all checkout events to analyze sessions
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
        p_start_date: range.start.toISOString(),
        p_end_date: range.end.toISOString(),
      });

    if (eventsError) {
      console.error('Get abandonment prediction events error:', eventsError);
      return apiError('Failed to fetch abandonment prediction data', 500);
    }

    // Calculate average checkout time for comparison
    const completedSessions: number[] = [];
    const sessionStartTimes: Record<string, Date> = {};

    events?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      
      if (event.event_type === 'checkout_start' || event.event_type === 'checkout_started') {
        sessionStartTimes[sessionId] = new Date(event.timestamp);
      }
      
      if (event.event_type === 'checkout_complete' || event.event_type === 'order_confirmed') {
        const startTime = sessionStartTimes[sessionId];
        if (startTime) {
          const duration = (new Date(event.timestamp).getTime() - startTime.getTime()) / 1000;
          if (duration > 0) {
            completedSessions.push(duration);
          }
        }
      }
    });

    const avgCheckoutTime = completedSessions.length > 0
      ? completedSessions.reduce((a, b) => a + b, 0) / completedSessions.length
      : 300; // Default 5 minutes if no data
    const typicalCheckoutDuration = getTypicalCheckoutDuration(avgCheckoutTime);

    // Analyze active and abandoned sessions
    const sessions: Record<string, {
      startTime: Date;
      lastActivity: Date;
      currentStep: string;
      stepStartTime: Record<string, Date>;
      errors: number;
      stepsVisited: Set<string>;
      completed: boolean;
      abandoned: boolean;
    }> = {};

    events?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;
      
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          startTime: new Date(event.timestamp),
          lastActivity: new Date(event.timestamp),
          currentStep: 'cart',
          stepStartTime: {},
          errors: 0,
          stepsVisited: new Set(),
          completed: false,
          abandoned: false,
        };
      }

      const session = sessions[sessionId];
      const eventTime = new Date(event.timestamp);
      
      if (eventTime > session.lastActivity) {
        session.lastActivity = eventTime;
      }

      switch (event.event_type) {
        case 'checkout_start':
        case 'checkout_started':
          session.startTime = eventTime;
          break;
        case 'step_viewed':
          if (event.step) {
            session.currentStep = event.step;
            session.stepsVisited.add(event.step);
            session.stepStartTime[event.step] = eventTime;
          }
          break;
        case 'error_occurred':
          session.errors++;
          break;
        case 'checkout_complete':
        case 'order_confirmed':
          session.completed = true;
          break;
        case 'step_abandoned':
          session.abandoned = true;
          break;
      }
    });

    // Calculate predictions for active/abandoned sessions
    const predictions: Array<{
      sessionId: string;
      prediction: ReturnType<typeof predictAbandonment>;
      isActive: boolean;
      isAbandoned: boolean;
      isCompleted: boolean;
    }> = [];

    Object.entries(sessions).forEach(([sessionId, session]) => {
      // Skip completed sessions for prediction (they're already done)
      if (session.completed) return;

      const totalDuration = (session.lastActivity.getTime() - session.startTime.getTime()) / 1000;
      const currentStepDuration = session.stepStartTime[session.currentStep]
        ? (session.lastActivity.getTime() - session.stepStartTime[session.currentStep].getTime()) / 1000
        : totalDuration;

      const stepOrder = ['cart', 'profile', 'shipping', 'payment'];
      const currentStepIndex = stepOrder.indexOf(session.currentStep);
      const stepProgress = stepOrder.length > 0 ? (currentStepIndex + 1) / stepOrder.length : 0.5;

      const factors: AbandonmentRiskFactors = {
        timeExceeded: typicalCheckoutDuration > 0 ? totalDuration / typicalCheckoutDuration : 0,
        errorCount: session.errors,
        currentStep: session.currentStep,
        stepDuration: currentStepDuration,
        totalDuration,
        hasReturned: session.stepsVisited.size > 1 && session.stepsVisited.has('cart'),
        stepProgress,
      };

      const prediction = predictAbandonment(factors);

      predictions.push({
        sessionId,
        prediction,
        isActive: !session.abandoned && !session.completed,
        isAbandoned: session.abandoned,
        isCompleted: session.completed,
      });
    });

    // Calculate aggregate statistics
    const highRiskSessions = predictions.filter(p => p.prediction.riskLevel === 'high' || p.prediction.riskLevel === 'critical');
    const avgRiskScore = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.prediction.riskScore, 0) / predictions.length
      : 0;

    const riskDistribution = {
      low: predictions.filter(p => p.prediction.riskLevel === 'low').length,
      medium: predictions.filter(p => p.prediction.riskLevel === 'medium').length,
      high: predictions.filter(p => p.prediction.riskLevel === 'high').length,
      critical: predictions.filter(p => p.prediction.riskLevel === 'critical').length,
    };

    // Calculate abandonment rate by risk level
    const abandonmentByRisk: Record<string, { total: number; abandoned: number; rate: number }> = {
      low: { total: 0, abandoned: 0, rate: 0 },
      medium: { total: 0, abandoned: 0, rate: 0 },
      high: { total: 0, abandoned: 0, rate: 0 },
      critical: { total: 0, abandoned: 0, rate: 0 },
    };

    predictions.forEach(p => {
      const level = p.prediction.riskLevel;
      abandonmentByRisk[level].total++;
      if (p.isAbandoned) {
        abandonmentByRisk[level].abandoned++;
      }
    });

    Object.keys(abandonmentByRisk).forEach(level => {
      const data = abandonmentByRisk[level];
      data.rate = data.total > 0 ? (data.abandoned / data.total) * 100 : 0;
    });

    return apiSuccess({
      summary: {
        totalSessions: predictions.length,
        highRiskSessions: highRiskSessions.length,
        avgRiskScore,
        typicalCheckoutDuration,
        avgCheckoutTime,
        riskDistribution,
        abandonmentByRisk,
      },
      predictions: predictions
        .sort((a, b) => b.prediction.riskScore - a.prediction.riskScore)
        .slice(0, 100), // Top 100 highest risk
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

