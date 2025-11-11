/**
 * Dashboard API - Individual Dashboard Operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSupabaseAdmin, getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import type { DashboardLayout } from '@/components/Dashboard/Builder/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/dashboards/[id]
 * Get a specific dashboard by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: dashboardId } = await params;

    if (!dashboardId) {
      return NextResponse.json({ error: 'Dashboard ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get dashboard using RPC function
    const { data: dashboard, error } = await supabaseAdmin
      .rpc('get_dashboard_by_id', {
        p_dashboard_id: dashboardId,
        p_account_id: user.account_id,
        p_user_id: user.id,
      });

    if (error) {
      console.error('❌ [DEBUG] Error fetching dashboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard' },
        { status: 500 }
      );
    }

    if (!dashboard || dashboard.length === 0) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
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

    return NextResponse.json({ dashboard: transformedDashboard });
  } catch (error: any) {
    console.error('❌ [DEBUG] Dashboard API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/dashboards/[id]
 * Update a dashboard
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

/**
 * PATCH /api/dashboard/dashboards/[id]
 * Update a dashboard (alias for PUT)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

/**
 * Shared update handler for PUT and PATCH
 */
async function handleUpdate(
  request: NextRequest,
  params: Promise<{ id: string }>
) {
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

    const { id: dashboardId } = await params;

    if (!dashboardId) {
      return NextResponse.json({ error: 'Dashboard ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, isPublic, layout } = body;

    const supabaseAdmin = getSupabaseAdmin();

    // Update dashboard using RPC function
    const { data: dashboard, error } = await supabaseAdmin
      .rpc('update_dashboard', {
        p_dashboard_id: dashboardId,
        p_account_id: user.account_id,
        p_user_id: user.id,
        p_name: name || null,
        p_description: description !== undefined ? description : null,
        p_is_public: isPublic !== undefined ? isPublic : null,
        p_layout: layout || null,
      });

    if (error) {
      console.error('❌ [DEBUG] Error updating dashboard:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update dashboard' },
        { status: 500 }
      );
    }

    if (!dashboard || dashboard.length === 0) {
      return NextResponse.json(
        { error: 'Dashboard not found or permission denied' },
        { status: 404 }
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
    console.error('❌ [DEBUG] Dashboard API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/dashboards/[id]
 * Delete a dashboard
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: dashboardId } = await params;

    if (!dashboardId) {
      return NextResponse.json({ error: 'Dashboard ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Delete dashboard using RPC function
    const { data: deleted, error } = await supabaseAdmin
      .rpc('delete_dashboard', {
        p_dashboard_id: dashboardId,
        p_account_id: user.account_id,
        p_user_id: user.id,
      });

    if (error) {
      console.error('❌ [DEBUG] Error deleting dashboard:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete dashboard' },
        { status: 500 }
      );
    }

    if (!deleted) {
      return NextResponse.json(
        { error: 'Dashboard not found or permission denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Dashboard deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ [DEBUG] Dashboard API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

