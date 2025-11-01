import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { z } from 'zod';

const settingsSchema = z.object({
  category: z.enum(['general', 'notifications', 'security', 'analytics']),
  settings: z.record(z.any()),
});

/**
 * GET /api/dashboard/settings
 * Get user settings
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

    // Get user settings (we'll store in dashboard.users table as JSONB)
    const { data: user, error: userError } = await supabaseAdmin
      .from('dashboard.users')
      .select('settings')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      settings: user.settings || {},
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dashboard/settings
 * Update user settings
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const validated = settingsSchema.parse(body);

    // Get current settings
    const { data: user, error: userError } = await supabaseAdmin
      .from('dashboard.users')
      .select('settings')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Merge new settings with existing
    const currentSettings = (user.settings || {}) as Record<string, any>;
    const updatedSettings = {
      ...currentSettings,
      [validated.category]: validated.settings,
    };

    // Update settings
    const { error: updateError } = await supabaseAdmin
      .from('dashboard.users')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user_id);

    if (updateError) {
      console.error('Update settings error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: updatedSettings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

