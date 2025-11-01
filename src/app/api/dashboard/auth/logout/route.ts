import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * POST /api/dashboard/auth/logout
 * Logout user and invalidate session
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const cookieStore = cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;
    const refreshToken = cookieStore.get('dashboard_refresh')?.value;

    // Delete session from database
    if (sessionToken) {
      await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('token', sessionToken);
    }

    if (refreshToken) {
      await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('refresh_token', refreshToken);
    }

    // Clear cookies
    cookieStore.delete('dashboard_session');
    cookieStore.delete('dashboard_refresh');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

