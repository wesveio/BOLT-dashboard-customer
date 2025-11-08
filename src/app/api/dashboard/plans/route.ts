import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, validateSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { withAuth } from '@/lib/api/route-handler';
import { apiError, apiInternalError } from '@/lib/api/responses';
import { isSessionValid } from '@/lib/api/auth';

/**
 * GET /api/dashboard/plans
 * Get all available plans for the authenticated user
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
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

    // Verify session is valid using RPC function (required for custom schema)
    const { data: sessions, error: sessionError } = await supabase
      .rpc('get_session_by_token', { p_token: sessionToken });

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (sessionError || !session) {
      console.error('🚨 [DEBUG] Session error:', sessionError);
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Validate session expiration (RPC already filters expired, but double-check with timezone-safe buffer)
    if (!isSessionValid(session.expires_at)) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Fetch all active plans using public function
    const { data: plans, error } = await supabase.rpc('get_plans');

    if (error) {
      console.error('❌ [DEBUG] Error fetching plans:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    return NextResponse.json({
      plans: plans || [],
    });
  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in plans endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/plans
 * Create or update a plan (admin only - for future use)
 */
export const POST = withAuth(async (_request: NextRequest, { user }) => {
  try {
    const validationError = validateSupabaseAdmin();
    if (validationError) return validationError;

    // Check permissions: only admin and owner can manage plans
    if (user.role !== 'admin' && user.role !== 'owner') {
      return apiError('Insufficient permissions to manage plans', 403);
    }

    // For now, return not implemented
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in plans POST endpoint:', error);
    return apiInternalError(error);
  }
});

