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

    // Duplicate theme using RPC function
    const { data: themes, error: duplicateError } = await supabaseAdmin
      .rpc('duplicate_theme', {
        p_theme_id: id,
        p_account_id: user.account_id,
        p_new_name: validated.newName,
        p_created_by: session.user_id,
      });

    const theme = themes && themes.length > 0 ? themes[0] : null;

    if (duplicateError || !theme) {
      console.error('Duplicate theme error:', duplicateError);
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

