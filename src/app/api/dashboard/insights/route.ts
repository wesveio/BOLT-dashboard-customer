import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { generateInsightsFromMetrics, generateBenchmarkInsights } from '@/utils/dashboard/insights-generator';
import type { AnalyticsEvent } from '@/hooks/useDashboardData';

/**
 * GET /api/dashboard/insights
 * Generate insights based on real checkout data
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Find session using RPC function (required for custom schema)
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .rpc('get_session_by_token', { p_token: sessionToken });

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (sessionError || !session) {
      console.error('🚨 [DEBUG] Session error:', sessionError);
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Validate session expiration (RPC already filters expired, but double-check)
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get user to find their account_id using RPC function (required for custom schema)
    const { data: users, error: userError } = await supabaseAdmin
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user) {
      console.error('🚨 [DEBUG] User query error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get metrics for insights generation
    const now = new Date();
    const currentPeriodStart = new Date(now.setMonth(now.getMonth() - 1));
    const previousPeriodStart = new Date(now.setMonth(now.getMonth() - 2));
    const previousPeriodEnd = currentPeriodStart;

    // Get current period events using RPC function (required for custom schema)
    const { data: currentEvents, error: currentError } = await supabaseAdmin
      .rpc('get_analytics_events', {
        p_customer_id: user.account_id,
        p_start_date: currentPeriodStart.toISOString(),
        p_end_date: new Date().toISOString(),
      });

    // Get previous period events using RPC function (required for custom schema)
    const { data: previousEvents } = await supabaseAdmin
      .rpc('get_analytics_events', {
        p_customer_id: user.account_id,
        p_start_date: previousPeriodStart.toISOString(),
        p_end_date: previousPeriodEnd.toISOString(),
      });

    if (currentError) {
      console.error('Get insights error:', currentError);
      return NextResponse.json(
        { error: 'Failed to fetch data for insights' },
        { status: 500 }
      );
    }

    // Calculate metrics
    const totalSessions = currentEvents?.filter((e: AnalyticsEvent) => e.event_type === 'checkout_start').length || 0;
    const totalConversions = currentEvents?.filter((e: AnalyticsEvent) => e.event_type === 'checkout_complete').length || 0;
    const previousConversions = previousEvents?.filter((e: AnalyticsEvent) => e.event_type === 'checkout_complete').length || 0;
    const previousSessions = previousEvents?.filter((e: AnalyticsEvent) => e.event_type === 'checkout_start').length || 1;

    // Helper function to clamp percentage between 0 and 100
    const clampPercentage = (value: number): number => {
      return Math.max(0, Math.min(100, value));
    };

    const conversionRate = clampPercentage(totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0);
    const previousConversionRate = clampPercentage(previousSessions > 0 ? (previousConversions / previousSessions) * 100 : 0);

    // Calculate abandonment rates
    const paymentSteps = currentEvents?.filter((e: AnalyticsEvent) => e.event_type === 'payment_step').length || 0;

    const paymentAbandonment = clampPercentage(paymentSteps > 0
      ? ((paymentSteps - totalConversions) / paymentSteps) * 100
      : 0);

    // Calculate device metrics
    const mobileSessions = currentEvents?.filter((e: AnalyticsEvent) =>
      e.event_type === 'checkout_start' && e.metadata?.deviceType === 'mobile'
    ).length || 0;
    const desktopSessions = currentEvents?.filter((e: AnalyticsEvent) =>
      e.event_type === 'checkout_start' && e.metadata?.deviceType === 'desktop'
    ).length || 0;
    const mobileConversions = currentEvents?.filter((e: AnalyticsEvent) =>
      e.event_type === 'checkout_complete' && e.metadata?.deviceType === 'mobile'
    ).length || 0;
    const desktopConversions = currentEvents?.filter((e: AnalyticsEvent) =>
      e.event_type === 'checkout_complete' && e.metadata?.deviceType === 'desktop'
    ).length || 0;

    const mobileConversionRate = clampPercentage(mobileSessions > 0 ? (mobileConversions / mobileSessions) * 100 : 0);
    const desktopConversionRate = clampPercentage(desktopSessions > 0 ? (desktopConversions / desktopSessions) * 100 : 0);

    // Calculate AOV
    let totalRevenue = 0;
    let previousRevenue = 0;

    currentEvents?.forEach((event: AnalyticsEvent) => {
      if (event.event_type === 'checkout_complete' && event.metadata?.revenue) {
        totalRevenue += parseFloat(String(event.metadata.revenue));
      }
    });

    previousEvents?.forEach((event: AnalyticsEvent) => {
      if (event.event_type === 'checkout_complete' && event.metadata?.revenue) {
        previousRevenue += parseFloat(String(event.metadata.revenue));
      }
    });

    const avgOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;
    const previousAOV = previousConversions > 0 ? previousRevenue / previousConversions : 0;

    // Calculate checkout time - only include positive durations
    const checkoutTimes: number[] = [];
    const sessionsMap: Record<string, Date> = {};

    currentEvents?.forEach((event: AnalyticsEvent) => {
      if (event.event_type === 'checkout_start') {
        sessionsMap[event.session_id] = new Date(event.timestamp);
      }
      if (event.event_type === 'checkout_complete' && sessionsMap[event.session_id]) {
        const startTime = sessionsMap[event.session_id];
        const endTime = new Date(event.timestamp);
        const duration = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds
        // Only add positive durations to avoid negative values
        if (duration >= 0) {
          checkoutTimes.push(duration);
        }
      }
    });

    // Ensure average checkout time is never negative
    const avgCheckoutTime = checkoutTimes.length > 0
      ? Math.max(0, checkoutTimes.reduce((a, b) => a + b, 0) / checkoutTimes.length)
      : 0;

    // Calculate peak hours (simplified - could be more sophisticated)
    const hourCounts: Record<number, number> = {};
    currentEvents?.forEach((event: AnalyticsEvent) => {
      if (event.event_type === 'checkout_start') {
        const hour = new Date(event.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([hour]) => `${hour}:00`);

    // Generate insights - ensure all values are valid
    const metrics = {
      conversionRate: Math.max(0, conversionRate),
      previousConversionRate: Math.max(0, previousConversionRate),
      abandonmentRate: clampPercentage(100 - conversionRate),
      mobileConversionRate: Math.max(0, mobileConversionRate),
      desktopConversionRate: Math.max(0, desktopConversionRate),
      avgOrderValue: Math.max(0, avgOrderValue),
      previousAOV: Math.max(0, previousAOV),
      paymentAbandonmentRate: paymentAbandonment,
      avgCheckoutTime: Math.max(0, avgCheckoutTime),
      peakHours,
    };

    const insights = [
      ...generateInsightsFromMetrics(metrics),
      ...generateBenchmarkInsights(metrics),
    ];

    // Sort by impact and limit to top 10
    const sortedInsights = insights
      .sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact as keyof typeof impactOrder] - impactOrder[a.impact as keyof typeof impactOrder];
      })
      .slice(0, 10);

    return NextResponse.json({
      insights: sortedInsights,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Generate insights error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

