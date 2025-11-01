import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { z } from 'zod';

const themeConfigSchema = z.object({
  name: z.string().min(1, 'Theme name is required'),
  layout: z.enum(['default', 'single-page', 'liquid-glass']),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
  }),
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  logo: z.string().optional(),
});

/**
 * GET /api/dashboard/themes
 * Get all themes for the authenticated user's account
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('dashboard_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Find session and user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('dashboard.sessions')
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

    // Get user to find their account_id
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('account_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get themes for this account
    const { data: themes, error: themesError } = await supabaseAdmin
      .from('dashboard.theme_configs')
      .select('*')
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false });

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

    // Find session and user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('dashboard.sessions')
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

    // Get user to find their account_id
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('account_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = themeConfigSchema.parse(body);

    // Create theme
    const { data: theme, error: createError } = await supabaseAdmin
      .from('dashboard.theme_configs')
      .insert({
        account_id: user.account_id,
        name: validated.name,
        config: validated,
        is_active: false,
        created_by: session.user_id,
      })
      .select()
      .single();

    if (createError) {
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
        { error: 'Validation error', details: error.errors },
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

