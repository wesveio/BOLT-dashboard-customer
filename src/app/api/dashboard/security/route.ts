/**
 * BoltGuard Security Dashboard API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { isSessionValid } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const validationError = validateSupabaseAdmin();
    if (validationError) return validationError;

    // Verify session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Verify session and get user
    const { data: sessions, error: sessionError } = await supabase.rpc('get_session_by_token', {
      p_token: sessionToken,
    });

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    if (!isSessionValid(session.expires_at)) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Get user to find account_id
    const { data: users, error: userError } = await supabase.rpc('get_user_by_id', {
      p_user_id: session.user_id,
    });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user || !user.account_id) {
      return NextResponse.json({ error: 'User or account not found' }, { status: 404 });
    }

    // Get period from query params
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    // Note: dateFrom is calculated but not yet used in mock data
    // In production, this will be used to filter data from the database
    let dateFrom: Date;
    let dateTo = new Date();

    if (startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
    } else {
      switch (period) {
        case '24h':
          dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    // Suppress unused variable warning - dateFrom will be used in production
    void dateFrom;

    // TODO: In production, fetch actual data from BoltGuard monitoring system
    // For now, return mock data structure
    const mockData = {
      metrics: {
        totalTransactions: 1250,
        highRiskTransactions: 45,
        blockedTransactions: 12,
        fraudDetected: 8,
        avgRiskScore: 32.5,
        validationErrors: 23,
        scaRequired: 156,
        anomaliesDetected: 67,
      },
      riskDistribution: {
        low: 950,
        medium: 245,
        high: 40,
        critical: 15,
      },
      recentAlerts: [
        {
          id: 'alert_1',
          type: 'High Risk Transaction',
          severity: 'high' as const,
          description: 'Transaction with risk score 75 detected',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'alert_2',
          type: 'Velocity Violation',
          severity: 'critical' as const,
          description: '10 transactions detected in last 5 minutes',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: 'alert_3',
          type: 'Anomaly Detected',
          severity: 'medium' as const,
          description: 'Statistical anomaly in transaction amount',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
      ],
      trendData: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(dateTo);
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString(),
          transactions: Math.floor(Math.random() * 200) + 150,
          highRisk: Math.floor(Math.random() * 10) + 5,
          blocked: Math.floor(Math.random() * 3) + 1,
        };
      }),
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('❌ [DEBUG] Security API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

