import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Support both old and expanded format
const themeConfigSchema = z.any(); // Use z.any() to accept both old and expanded formats
// The expanded format is too complex to validate with zod without being overly verbose
// We'll validate structure in the handler if needed

/**
 * GET /api/dashboard/themes
 * Get all themes for the authenticated user's account
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
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
      console.error('🚨 [DEBUG] User query error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get themes for this account using RPC function (required for custom schema)
    const { data: themes, error: themesError } = await supabaseAdmin
      .rpc('get_themes_by_account', { p_account_id: user.account_id });

    if (themesError) {
      console.error('Get themes error:', themesError);
      return NextResponse.json(
        { error: 'Failed to fetch themes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      themes: themes || [],
    });
  } catch (error) {
    console.error('Get themes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/themes
 * Create a new theme
 */
export async function POST(request: NextRequest) {
  try {
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
      console.error('🚨 [DEBUG] User query error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = themeConfigSchema.parse(body);

    // Extract baseTheme if present (can be in root or in config)
    const baseTheme = validated.baseTheme || validated.config?.baseTheme || null;
    
    // Remove baseTheme from config if it's at root level to avoid duplication
    const configForStorage = { ...validated };
    if (configForStorage.baseTheme && configForStorage.baseTheme === baseTheme) {
      // Keep it in config, but also pass as separate parameter
    }

    // Create theme using RPC function (required for custom schema)
    const { data: themes, error: createError } = await supabaseAdmin
      .rpc('create_theme', {
        p_account_id: user.account_id,
        p_name: validated.name,
        p_config: configForStorage,
        p_created_by: session.user_id,
        p_is_active: false,
        p_base_theme: baseTheme,
      });

    const theme = themes && themes.length > 0 ? themes[0] : null;

    if (createError || !theme) {
      console.error('Create theme error:', createError);
      return NextResponse.json(
        { error: 'Failed to create theme' },
        { status: 500 }
      );
    }

    return NextResponse.json({ theme }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create theme error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

