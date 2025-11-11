/**
 * Custom Dashboards API
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSupabaseAdmin, getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import type { DashboardLayout } from '@/components/Dashboard/Builder/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/dashboards
 * Get all dashboards for the authenticated user (public + private)
 */
export async function GET() {
  try {
    const validationError = validateSupabaseAdmin();
    if (validationError) return validationError;

    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    if (!user.id) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 404 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get dashboards using RPC function
    const { data: dashboards, error } = await supabaseAdmin
      .rpc('get_dashboards_by_account', {
        p_account_id: user.account_id,
        p_user_id: user.id,
      });

    if (error) {
      console.error('❌ [DEBUG] Error fetching dashboards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboards' },
        { status: 500 }
      );
    }

    // Transform database format to frontend format
    const transformedDashboards: DashboardLayout[] = (dashboards || []).map((db: any) => ({
      id: db.id,
      name: db.name,
      description: db.description,
      isPublic: db.is_public,
      widgets: db.layout?.widgets || [],
      columns: db.layout?.columns || 12,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    }));

    return NextResponse.json({ dashboards: transformedDashboards });
  } catch (error: any) {
    console.error('❌ [DEBUG] Dashboards API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/dashboards
 * Create a new dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const validationError = validateSupabaseAdmin();
    if (validationError) return validationError;

    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    if (!user.id) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, isPublic, layout } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Dashboard name is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create dashboard using RPC function
    const { data: dashboard, error } = await supabaseAdmin
      .rpc('create_dashboard', {
        p_account_id: user.account_id,
        p_user_id: user.id,
        p_name: name.trim(),
        p_description: description || null,
        p_is_public: isPublic || false,
        p_layout: layout || { widgets: [], columns: 12 },
      });

    if (error) {
      console.error('❌ [DEBUG] Error creating dashboard:', error);
      return NextResponse.json(
        { error: 'Failed to create dashboard' },
        { status: 500 }
      );
    }

    if (!dashboard || dashboard.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create dashboard' },
        { status: 500 }
      );
    }

    const dbDashboard = dashboard[0];

    // Transform to frontend format
    const transformedDashboard: DashboardLayout = {
      id: dbDashboard.id,
      name: dbDashboard.name,
      description: dbDashboard.description,
      isPublic: dbDashboard.is_public,
      widgets: dbDashboard.layout?.widgets || [],
      columns: dbDashboard.layout?.columns || 12,
      createdAt: dbDashboard.created_at,
      updatedAt: dbDashboard.updated_at,
    };

    return NextResponse.json({
      success: true,
      dashboard: transformedDashboard,
    });
  } catch (error: any) {
    console.error('❌ [DEBUG] Dashboards API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

