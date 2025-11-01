import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * GET /api/dashboard/analytics/shipping
 * Get shipping method analytics for the authenticated user's account
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

    // Get shipping method data from analytics.events
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Calculate date range
    const now = new Date();
    const dateRanges: Record<string, { start: Date; end: Date }> = {
      today: {
        start: new Date(now.setHours(0, 0, 0, 0)),
        end: new Date(),
      },
      week: {
        start: new Date(now.setDate(now.getDate() - 7)),
        end: new Date(),
      },
      month: {
        start: new Date(now.setMonth(now.getMonth() - 1)),
        end: new Date(),
      },
      year: {
        start: new Date(now.setFullYear(now.getFullYear() - 1)),
        end: new Date(),
      },
    };

    const range = dateRanges[period] || dateRanges.week;

    // Query shipping-related events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('analytics.events')
      .select('*')
      .eq('customer_id', user.account_id)
      .eq('event_type', 'shipping_method_selected')
      .gte('timestamp', range.start.toISOString())
      .lte('timestamp', range.end.toISOString());

    if (eventsError) {
      console.error('Get shipping analytics error:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch shipping analytics' },
        { status: 500 }
      );
    }

    // Aggregate shipping methods
    const shippingMethods: Record<string, {
      method: string;
      count: number;
      totalCost: number;
      avgDays: number;
    }> = {};

    events?.forEach((event) => {
      const method = event.metadata?.shippingMethod as string || 'Unknown';
      if (!shippingMethods[method]) {
        shippingMethods[method] = {
          method,
          count: 0,
          totalCost: 0,
          avgDays: 0,
        };
      }

      shippingMethods[method].count++;
      if (event.metadata?.shippingCost) {
        shippingMethods[method].totalCost += parseFloat(event.metadata.shippingCost);
      }
      if (event.metadata?.deliveryDays) {
        shippingMethods[method].avgDays += parseInt(event.metadata.deliveryDays);
      }
    });

    // Convert to array and calculate averages
    const shippingData = Object.values(shippingMethods).map((method) => ({
      method: method.method,
      count: method.count,
      avgDays: method.count > 0 ? method.avgDays / method.count : 0,
      avgCost: method.count > 0 ? method.totalCost / method.count : 0,
    }));

    const totalShipments = shippingData.reduce((sum, item) => sum + item.count, 0);
    const avgShippingCost = totalShipments > 0
      ? shippingData.reduce((sum, item) => sum + item.avgCost * item.count, 0) / totalShipments
      : 0;

    return NextResponse.json({
      shippingMethods: shippingData,
      totalShipments,
      avgShippingCost: avgShippingCost.toFixed(2),
      period,
    });
  } catch (error) {
    console.error('Get shipping analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

