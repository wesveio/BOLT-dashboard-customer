import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Support both old and expanded format
const themeConfigSchema = z.any(); // Use z.any() to accept both old and expanded formats

/**
 * GET /api/dashboard/themes/[id]
 * Get a specific theme
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

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

    // Validate session expiration (RPC already filters expired, but double-check)
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get user to find their account_id using RPC function (required for custom schema)
    const { data: users, error: userError } = await supabaseAdmin
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get theme using RPC function (required for custom schema)
    const { data: themes, error: themeError } = await supabaseAdmin
      .rpc('get_theme_by_id', {
        p_theme_id: id,
        p_account_id: user.account_id,
      });

    const theme = themes && themes.length > 0 ? themes[0] : null;

    if (themeError || !theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }

    return NextResponse.json({ theme });
  } catch (error) {
    console.error('Get theme error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dashboard/themes/[id]
 * Update a theme
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

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

    // Validate session expiration (RPC already filters expired, but double-check)
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get user to find their account_id using RPC function (required for custom schema)
    const { data: users, error: userError } = await supabaseAdmin
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = themeConfigSchema.parse(body);

    // Update theme using RPC function (required for custom schema)
    const { data: themes, error: updateError } = await supabaseAdmin
      .rpc('update_theme', {
        p_theme_id: id,
        p_account_id: user.account_id,
        p_name: validated.name,
        p_config: validated,
      });

    const theme = themes && themes.length > 0 ? themes[0] : null;

    if (updateError || !theme) {
      console.error('Update theme error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update theme' },
        { status: 500 }
      );
    }

    return NextResponse.json({ theme });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Update theme error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/themes/[id]
 * Activate a theme (special route - when method is POST to /themes/[id], it activates)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

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

    // Validate session expiration (RPC already filters expired, but double-check)
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get user to find their account_id using RPC function (required for custom schema)
    const { data: users, error: userError } = await supabaseAdmin
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if theme exists and belongs to this account using RPC function
    const { data: themeExists, error: checkError } = await supabaseAdmin
      .rpc('check_theme_exists', {
        p_theme_id: id,
        p_account_id: user.account_id,
      });

    if (checkError || themeExists !== true) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // Activate the selected theme using RPC function (required for custom schema)
    // This function automatically deactivates all other themes first
    const { data: themes, error: activateError } = await supabaseAdmin
      .rpc('activate_theme', {
        p_theme_id: id,
        p_account_id: user.account_id,
      });

    const theme = themes && themes.length > 0 ? themes[0] : null;

    if (activateError || !theme) {
      console.error('Activate theme error:', activateError);
      return NextResponse.json(
        { error: 'Failed to activate theme' },
        { status: 500 }
      );
    }

    return NextResponse.json({ theme });
  } catch (error) {
    console.error('Activate theme error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

