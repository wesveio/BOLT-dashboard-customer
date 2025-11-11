/**
 * BoltMetrics Custom Dashboards API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { isSessionValid } from '@/lib/api/auth';
import { getAuthenticatedUser } from '@/lib/api/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const validationError = validateSupabaseAdmin();
    if (validationError) return validationError;

    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();

    // TODO: In production, fetch dashboards from database
    // For now, return mock data
    const mockDashboards = [
      {
        id: 'dashboard_1',
        name: 'Overview Dashboard',
        widgets: [],
        columns: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({ dashboards: mockDashboards });
  } catch (error) {
    console.error('❌ [DEBUG] Dashboards API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const validationError = validateSupabaseAdmin();
    if (validationError) return validationError;

    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, dashboard } = body;

    if (action === 'save') {
      // TODO: In production, save to database
      // For now, just return success
      return NextResponse.json({
        success: true,
        dashboard: {
          ...dashboard,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('❌ [DEBUG] Dashboards API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

