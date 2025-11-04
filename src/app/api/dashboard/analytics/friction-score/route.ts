import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getDateRange, parsePeriod } from '@/utils/date-ranges';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';
import {
  calculateFrictionScore,
  calculateAverageFriction,
  type FrictionFactors,
} from '@/utils/dashboard/friction-calculator';

/**
 * GET /api/dashboard/analytics/friction-score
 * Get friction score analytics
 */
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

    // Query all checkout events
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
      console.error('Get friction score events error:', eventsError);
      return apiError('Failed to fetch friction score data', 500);
    }

    // Analyze sessions
    const sessions: Record<string, {
      startTime: Date;
      lastActivity: Date;
      errors: number;
      backNavigations: number;
      stepsVisited: Set<string>;
      stepsCompleted: Set<string>;
      fieldsFilled: number;
      totalFields: number;
      completed: boolean;
      abandoned: boolean;
      hasReturned: boolean;
    }> = {};

    events?.forEach((event: AnalyticsEvent) => {
      const sessionId = event.session_id;

      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          startTime: new Date(event.timestamp),
          lastActivity: new Date(event.timestamp),
          errors: 0,
          backNavigations: 0,
          stepsVisited: new Set(),
          stepsCompleted: new Set(),
          fieldsFilled: 0,
          totalFields: 0,
          completed: false,
          abandoned: false,
          hasReturned: false,
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
            session.stepsVisited.add(event.step);
            // If viewing a step that was already visited, count as back navigation
            if (session.stepsCompleted.has(event.step)) {
              session.backNavigations++;
            }
          }
          break;
        case 'step_completed':
          if (event.step) {
            session.stepsCompleted.add(event.step);
            session.stepsVisited.add(event.step);
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

      // Estimate fields filled from metadata
      const metadata = event.metadata || {};
      if (metadata.fieldsFilled !== undefined) {
        session.fieldsFilled = Math.max(session.fieldsFilled, Number(metadata.fieldsFilled) || 0);
      }
      if (metadata.totalFields !== undefined) {
        session.totalFields = Math.max(session.totalFields, Number(metadata.totalFields) || 0);
      }
    });

    // Calculate friction scores
    const frictionScores: Array<{
      sessionId: string;
      score: ReturnType<typeof calculateFrictionScore>;
      conversion: boolean;
    }> = [];

    Object.entries(sessions).forEach(([sessionId, session]) => {
      const totalDuration = (session.lastActivity.getTime() - session.startTime.getTime()) / 1000;

      // Check if user returned (had multiple checkout starts)
      const checkoutStarts = events?.filter(
        (e: AnalyticsEvent) =>
          e.session_id === sessionId &&
          (e.event_type === 'checkout_start' || e.event_type === 'checkout_started')
      ) || [];
      const hasReturned = checkoutStarts.length > 1;

      const factors: FrictionFactors = {
        totalDuration,
        errorCount: session.errors,
        backNavigations: session.backNavigations,
        fieldsFilled: session.fieldsFilled || session.stepsCompleted.size * 3, // Estimate
        totalFields: session.totalFields || session.stepsVisited.size * 5, // Estimate
        stepsCompleted: session.stepsCompleted.size,
        totalSteps: 4, // cart, profile, shipping, payment
        hasReturned,
      };

      const score = calculateFrictionScore(factors);

      frictionScores.push({
        sessionId,
        score,
        conversion: session.completed,
      });
    });

    // Calculate aggregate statistics
    const avgFriction = calculateAverageFriction(frictionScores.map(fs => fs.score));

    // Calculate correlation between friction and conversion
    const highFrictionSessions = frictionScores.filter(fs => fs.score.score >= 50);
    const lowFrictionSessions = frictionScores.filter(fs => fs.score.score < 50);
    const highFrictionConversionRate = highFrictionSessions.length > 0
      ? (highFrictionSessions.filter(fs => fs.conversion).length / highFrictionSessions.length) * 100
      : 0;
    const lowFrictionConversionRate = lowFrictionSessions.length > 0
      ? (lowFrictionSessions.filter(fs => fs.conversion).length / lowFrictionSessions.length) * 100
      : 0;

    // Calculate friction trend over time (daily averages)
    const dailyFriction: Record<string, number[]> = {};
    frictionScores.forEach((fs) => {
      const session = sessions[fs.sessionId];
      const date = session.startTime.toISOString().split('T')[0];
      if (!dailyFriction[date]) {
        dailyFriction[date] = [];
      }
      dailyFriction[date].push(fs.score.score);
    });

    const frictionTrend = Object.entries(dailyFriction)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => {
        const completedOnDate = Object.values(sessions).filter(
          (s) => s.startTime.toISOString().split('T')[0] === date && s.completed
        ).length;
        return {
          date,
          avgFriction: scores.reduce((a, b) => a + b, 0) / scores.length,
          conversionRate: scores.length > 0 ? (completedOnDate / scores.length) * 100 : 0,
        };
      });

    return apiSuccess({
      summary: {
        totalSessions: frictionScores.length,
        avgFrictionScore: avgFriction.avgScore,
        frictionDistribution: avgFriction.distribution,
        frictionBreakdown: avgFriction.avgBreakdown,
        highFrictionConversionRate,
        lowFrictionConversionRate,
        correlation: lowFrictionConversionRate - highFrictionConversionRate,
      },
      frictionScores: frictionScores
        .sort((a, b) => b.score.score - a.score.score)
        .slice(0, 100), // Top 100 highest friction
      frictionTrend,
      period,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

