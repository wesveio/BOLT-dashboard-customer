import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { isAuthBypassEnabled, getMockUser } from '@/utils/auth/dev-bypass';

/**
 * GET /api/dashboard/auth/me
 * Get current authenticated user
 */
export async function GET(_: NextRequest) {
  try {
    // Development bypass - only works in development mode
    if (isAuthBypassEnabled()) {
      console.warn('‼️ [DEBUG] Auth bypass enabled - returning mock user');
      const mockUser = getMockUser();

      // Set a mock session cookie to maintain consistency
      const cookieStore = cookies();
      cookieStore.set('dashboard_session', 'dev-bypass-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
      });

      return NextResponse.json({
        user: mockUser,
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const cookieStore = cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

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

    // Validate session expiration
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get user details using RPC function (required for custom schema)
    const { data: users, error: userError } = await supabaseAdmin
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError) {
      console.error('🚨 [DEBUG] User query error:', userError);
      console.error('🚨 [DEBUG] User ID:', session.user_id);
    }

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Note: RPC function get_user_by_id doesn't include phone, company, job_title
    // These fields were added later. We need to use SQL or update the function.
    // For now, returning available fields from RPC function
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: null, // TODO: Update RPC function to include this field
        company: null, // TODO: Update RPC function to include this field
        jobTitle: null, // TODO: Update RPC function to include this field
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login || null,
        accountId: user.account_id,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

