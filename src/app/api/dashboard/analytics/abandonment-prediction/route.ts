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

    console.info('✅ [DEBUG] Abandonment prediction - Date range:', {
      period,
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    });

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
      console.error('❌ [DEBUG] Get abandonment prediction events error:', eventsError);
      return apiError('Failed to fetch abandonment prediction data', 500);
    }

    console.info('✅ [DEBUG] Abandonment prediction - Events found:', events?.length || 0);

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

    console.info('✅ [DEBUG] Abandonment prediction - Checkout time analysis:', {
      completedSessions: completedSessions.length,
      avgCheckoutTime: avgCheckoutTime.toFixed(2),
      typicalCheckoutDuration: typicalCheckoutDuration.toFixed(2),
    });

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

    let completedSessionsCount = 0;
    let activeSessionsCount = 0;
    let abandonedSessionsCount = 0;

    Object.entries(sessions).forEach(([sessionId, session]) => {
      // Track all sessions for statistics
      if (session.completed) {
        completedSessionsCount++;
      } else if (session.abandoned) {
        abandonedSessionsCount++;
      } else {
        activeSessionsCount++;
      }

      // Skip completed sessions for prediction (they're already done)
      if (session.completed) return;

      const totalDuration = (session.lastActivity.getTime() - session.startTime.getTime()) / 1000;
      const currentStepDuration = session.stepStartTime[session.currentStep]
        ? (session.lastActivity.getTime() - session.stepStartTime[session.currentStep].getTime()) / 1000
        : totalDuration;

      const stepOrder = ['cart', 'profile', 'shipping', 'payment'];
      const currentStepIndex = stepOrder.indexOf(session.currentStep);
      const stepProgress = stepOrder.length > 0 
        ? Math.max(0, Math.min(1, (currentStepIndex + 1) / stepOrder.length))
        : 0.5;

      // Calculate hasReturned: user visited multiple steps, indicating they navigated back
      // This shows intent to complete checkout (positive signal)
      const hasReturned = session.stepsVisited.size > 1;

      const factors: AbandonmentRiskFactors = {
        timeExceeded: typicalCheckoutDuration > 0 
          ? Math.max(0, totalDuration / typicalCheckoutDuration)
          : 0,
        errorCount: session.errors,
        currentStep: session.currentStep || 'cart',
        stepDuration: Math.max(0, currentStepDuration),
        totalDuration: Math.max(0, totalDuration),
        hasReturned,
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

    const totalSessions = Object.keys(sessions).length;

    console.info('✅ [DEBUG] Abandonment prediction - Session analysis:', {
      totalSessions,
      completedSessions: completedSessionsCount,
      activeSessions: activeSessionsCount,
      abandonedSessions: abandonedSessionsCount,
      sessionsForPrediction: predictions.length,
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

    console.info('✅ [DEBUG] Abandonment prediction - Risk analysis:', {
      avgRiskScore: avgRiskScore.toFixed(2),
      highRiskSessions: highRiskSessions.length,
      riskDistribution,
    });

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

    console.info('✅ [DEBUG] Abandonment prediction - Final summary:', {
      totalSessions,
      sessionsForPrediction: predictions.length,
      highRiskSessions: highRiskSessions.length,
      avgRiskScore: avgRiskScore.toFixed(2),
      abandonmentByRisk,
    });

    return apiSuccess({
      summary: {
        totalSessions, // Use actual total sessions, not just predictions
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
    console.error('❌ [DEBUG] Abandonment prediction error:', error);
    return apiInternalError(error);
  }
}

