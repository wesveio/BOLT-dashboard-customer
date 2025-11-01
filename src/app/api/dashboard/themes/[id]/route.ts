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
 * GET /api/dashboard/themes/[id]
 * Get a specific theme
 */
export async function GET(
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
      .from('dashboard.users')
      .select('account_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get theme
    const { data: theme, error: themeError } = await supabaseAdmin
      .from('dashboard.theme_configs')
      .select('*')
      .eq('id', id)
      .eq('account_id', user.account_id)
      .single();

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
      .from('dashboard.users')
      .select('account_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = themeConfigSchema.parse(body);

    // Update theme
    const { data: theme, error: updateError } = await supabaseAdmin
      .from('dashboard.theme_configs')
      .update({
        name: validated.name,
        config: validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('account_id', user.account_id)
      .select()
      .single();

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
        { error: 'Validation error', details: error.errors },
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
      .from('dashboard.users')
      .select('account_id')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if theme exists and belongs to this account
    const { data: existingTheme, error: checkError } = await supabaseAdmin
      .from('dashboard.theme_configs')
      .select('id')
      .eq('id', id)
      .eq('account_id', user.account_id)
      .single();

    if (checkError || !existingTheme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }

    // Deactivate all themes for this account
    await supabaseAdmin
      .from('dashboard.theme_configs')
      .update({ is_active: false })
      .eq('account_id', user.account_id);

    // Activate the selected theme
    const { data: theme, error: activateError } = await supabaseAdmin
      .from('dashboard.theme_configs')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('account_id', user.account_id)
      .select()
      .single();

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

