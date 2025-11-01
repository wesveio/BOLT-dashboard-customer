import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { isAuthBypassEnabled, getMockUser } from '@/utils/auth/dev-bypass';

/**
 * GET /api/dashboard/auth/me
 * Get current authenticated user
 */
export async function GET(request: NextRequest) {
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

    // Find session and user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
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

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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

