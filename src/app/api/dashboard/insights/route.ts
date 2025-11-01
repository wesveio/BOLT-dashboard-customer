import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { generateInsightsFromMetrics, generateBenchmarkInsights } from '@/utils/dashboard/insights-generator';

/**
 * GET /api/dashboard/insights
 * Generate insights based on real checkout data
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Find session and user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('dashboard.sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get user to find their account_id
    const { data: user, error: userError } = await supabaseAdmin
      .from('dashboard.users')
      .select('account_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get metrics for insights generation
    const now = new Date();
    const currentPeriodStart = new Date(now.setMonth(now.getMonth() - 1));
    const previousPeriodStart = new Date(now.setMonth(now.getMonth() - 2));
    const previousPeriodEnd = currentPeriodStart;

    // Get current period events
    const { data: currentEvents, error: currentError } = await supabaseAdmin
      .from('analytics.events')
      .select('*')
      .eq('customer_id', user.account_id)
      .gte('timestamp', currentPeriodStart.toISOString())
      .lte('timestamp', new Date().toISOString());

    // Get previous period events
    const { data: previousEvents } = await supabaseAdmin
      .from('analytics.events')
      .select('*')
      .eq('customer_id', user.account_id)
      .gte('timestamp', previousPeriodStart.toISOString())
      .lte('timestamp', previousPeriodEnd.toISOString());

    if (currentError) {
      console.error('Get insights error:', currentError);
      return NextResponse.json(
        { error: 'Failed to fetch data for insights' },
        { status: 500 }
      );
    }

    // Calculate metrics
    const totalSessions = currentEvents?.filter((e) => e.event_type === 'checkout_start').length || 0;
    const totalConversions = currentEvents?.filter((e) => e.event_type === 'checkout_complete').length || 0;
    const previousConversions = previousEvents?.filter((e) => e.event_type === 'checkout_complete').length || 0;
    const previousSessions = previousEvents?.filter((e) => e.event_type === 'checkout_start').length || 1;

    const conversionRate = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0;
    const previousConversionRate = previousSessions > 0 ? (previousConversions / previousSessions) * 100 : 0;

    // Calculate abandonment rates
    const cartViews = currentEvents?.filter((e) => e.event_type === 'cart_view').length || 0;
    const profileSteps = currentEvents?.filter((e) => e.event_type === 'profile_step').length || 0;
    const shippingSteps = currentEvents?.filter((e) => e.event_type === 'shipping_step').length || 0;
    const paymentSteps = currentEvents?.filter((e) => e.event_type === 'payment_step').length || 0;

    const paymentAbandonment = paymentSteps > 0
      ? ((paymentSteps - totalConversions) / paymentSteps) * 100
      : 0;

    // Calculate device metrics
    const mobileSessions = currentEvents?.filter((e) => 
      e.event_type === 'checkout_start' && e.metadata?.deviceType === 'mobile'
    ).length || 0;
    const desktopSessions = currentEvents?.filter((e) => 
      e.event_type === 'checkout_start' && e.metadata?.deviceType === 'desktop'
    ).length || 0;
    const mobileConversions = currentEvents?.filter((e) => 
      e.event_type === 'checkout_complete' && e.metadata?.deviceType === 'mobile'
    ).length || 0;
    const desktopConversions = currentEvents?.filter((e) => 
      e.event_type === 'checkout_complete' && e.metadata?.deviceType === 'desktop'
    ).length || 0;

    const mobileConversionRate = mobileSessions > 0 ? (mobileConversions / mobileSessions) * 100 : 0;
    const desktopConversionRate = desktopSessions > 0 ? (desktopConversions / desktopSessions) * 100 : 0;

    // Calculate AOV
    let totalRevenue = 0;
    let previousRevenue = 0;

    currentEvents?.forEach((event) => {
      if (event.event_type === 'checkout_complete' && event.metadata?.revenue) {
        totalRevenue += parseFloat(event.metadata.revenue);
      }
    });

    previousEvents?.forEach((event) => {
      if (event.event_type === 'checkout_complete' && event.metadata?.revenue) {
        previousRevenue += parseFloat(event.metadata.revenue);
      }
    });

    const avgOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;
    const previousAOV = previousConversions > 0 ? previousRevenue / previousConversions : 0;

    // Calculate checkout time
    const checkoutTimes: number[] = [];
    const sessionsMap: Record<string, Date> = {};

    currentEvents?.forEach((event) => {
      if (event.event_type === 'checkout_start') {
        sessionsMap[event.session_id] = new Date(event.timestamp);
      }
      if (event.event_type === 'checkout_complete' && sessionsMap[event.session_id]) {
        const startTime = sessionsMap[event.session_id];
        const endTime = new Date(event.timestamp);
        const duration = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds
        checkoutTimes.push(duration);
      }
    });

    const avgCheckoutTime = checkoutTimes.length > 0
      ? checkoutTimes.reduce((a, b) => a + b, 0) / checkoutTimes.length
      : 0;

    // Calculate peak hours (simplified - could be more sophisticated)
    const hourCounts: Record<number, number> = {};
    currentEvents?.forEach((event) => {
      if (event.event_type === 'checkout_start') {
        const hour = new Date(event.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([hour]) => `${hour}:00`);

    // Generate insights
    const metrics = {
      conversionRate,
      previousConversionRate,
      abandonmentRate: 100 - conversionRate,
      mobileConversionRate,
      desktopConversionRate,
      avgOrderValue,
      previousAOV,
      paymentAbandonmentRate: paymentAbandonment,
      avgCheckoutTime,
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
        return impactOrder[b.impact] - impactOrder[a.impact];
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

