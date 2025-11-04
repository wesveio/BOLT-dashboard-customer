import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { z } from 'zod';

const duplicateSchema = z.object({
  newName: z.string().min(1, 'Theme name is required'),
});

/**
 * POST /api/dashboard/themes/[id]/duplicate
 * Duplicate a theme
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

    // Find session
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .rpc('get_session_by_token', { p_token: sessionToken });

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get user
    const { data: users, error: userError } = await supabaseAdmin
      .rpc('get_user_by_id', { p_user_id: session.user_id });

    const user = users && users.length > 0 ? users[0] : null;

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = duplicateSchema.parse(body);

    // For default themes (special IDs), we need to handle differently
    const isDefaultTheme = id.startsWith('default-') || id.includes('theme');
    
    let duplicateResult;
    
    if (isDefaultTheme && (id === 'default-theme' || id === 'single-page-theme' || id === 'liquid-glass-theme')) {
      // Handle default theme duplication by creating from default config
      const baseThemeMap: Record<string, 'default' | 'single-page' | 'liquid-glass'> = {
        'default-theme': 'default',
        'single-page-theme': 'single-page',
        'liquid-glass-theme': 'liquid-glass',
      };
      
      const baseTheme = baseThemeMap[id];
      
      if (!baseTheme) {
        return NextResponse.json(
          { error: 'Invalid default theme ID' },
          { status: 400 }
        );
      }

      // Import getDefaultThemeConfig
      const { getDefaultThemeConfig } = await import('@/components/Dashboard/ThemeEditor/defaults');
      const defaultConfig = getDefaultThemeConfig(baseTheme);
      
      // Create theme using default config
      const { data: themes, error: createError } = await supabaseAdmin.rpc('create_theme', {
        p_account_id: user.account_id,
        p_name: validated.newName,
        p_config: {
          ...defaultConfig,
          baseTheme: baseTheme,
        },
        p_created_by: session.user_id,
        p_is_active: false,
        p_base_theme: baseTheme,
        p_is_default: false,
        p_is_readonly: false,
      });

      duplicateResult = { themes, error: createError };
    } else {
      // Duplicate existing theme using RPC function
      const result = await supabaseAdmin.rpc('duplicate_theme', {
        p_theme_id: id,
        p_account_id: user.account_id,
        p_new_name: validated.newName,
        p_created_by: session.user_id,
      });

      duplicateResult = { themes: result.data, error: result.error };
    }

    const theme = duplicateResult.themes && Array.isArray(duplicateResult.themes) && duplicateResult.themes.length > 0 
      ? duplicateResult.themes[0] 
      : duplicateResult.themes;

    if (duplicateResult.error || !theme) {
      console.error('Duplicate theme error:', duplicateResult.error);
      return NextResponse.json(
        { error: 'Failed to duplicate theme' },
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
    console.error('Duplicate theme error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

