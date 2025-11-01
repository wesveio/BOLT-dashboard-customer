import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyCode } from '@/utils/auth/code-generator';
import { generateSessionToken } from '@/utils/auth/code-generator';
import { cookies } from 'next/headers';
import { isAuthBypassEnabled, getMockUser } from '@/utils/auth/dev-bypass';

const verifyCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

/**
 * POST /api/dashboard/auth/verify-code
 * Verify access code and create session (passwordless auth)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = verifyCodeSchema.parse(body);

    // Development bypass - only works in development mode
    if (isAuthBypassEnabled()) {
      console.warn('‼️ [DEBUG] Auth bypass enabled - skipping code verification');
      
      const mockUser = getMockUser();
      const sessionToken = generateSessionToken();
      const refreshToken = generateSessionToken();
      
      const sessionDurationHours = parseInt(
        process.env.AUTH_SESSION_DURATION_HOURS || '24',
        10
      );
      const refreshDurationDays = parseInt(
        process.env.AUTH_REFRESH_TOKEN_DURATION_DAYS || '30',
        10
      );

      // Set HTTP-only cookies
      const cookieStore = cookies();
      cookieStore.set('dashboard_session', sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: sessionDurationHours * 60 * 60,
        path: '/',
      });

      cookieStore.set('dashboard_refresh', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: refreshDurationDays * 24 * 60 * 60,
        path: '/',
      });

      return NextResponse.json({
        success: true,
        user: mockUser,
      });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Find valid auth code
    const { data: authCode, error: findError } = await supabaseAdmin
      .from('auth_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !authCode) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 401 }
      );
    }

    // Check attempts limit
    const maxAttempts = parseInt(process.env.AUTH_CODE_MAX_ATTEMPTS || '5', 10);
    if (authCode.attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    // Verify code
    const codeHash = `${authCode.code_salt}:${authCode.code_hash}`;
    const isValid = verifyCode(code, codeHash);

    if (!isValid) {
      // Increment attempts
      await supabaseAdmin
        .from('auth_codes')
        .update({ attempts: authCode.attempts + 1 })
        .eq('id', authCode.id);

      return NextResponse.json(
        { error: 'Invalid code. Please try again.' },
        { status: 401 }
      );
    }

    // Mark code as used
    await supabaseAdmin
      .from('auth_codes')
      .update({ used: true })
      .eq('id', authCode.id);

    // Find user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    // If user doesn't exist, they need to be invited first
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Account not found. Please contact support to get access.' },
        { status: 404 }
      );
    }

    // Generate session tokens
    const sessionToken = generateSessionToken();
    const refreshToken = generateSessionToken();
    
    const sessionDurationHours = parseInt(
      process.env.AUTH_SESSION_DURATION_HOURS || '24',
      10
    );
    const refreshDurationDays = parseInt(
      process.env.AUTH_REFRESH_TOKEN_DURATION_DAYS || '30',
      10
    );

    const expiresAt = new Date(Date.now() + sessionDurationHours * 60 * 60 * 1000);
    const refreshExpiresAt = new Date(Date.now() + refreshDurationDays * 24 * 60 * 60 * 1000);

    // Store session
    const { error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: user.id,
        token: sessionToken,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString(),
        refresh_expires_at: refreshExpiresAt.toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Update user last login
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Set HTTP-only cookies
    const cookieStore = cookies();
    cookieStore.set('dashboard_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionDurationHours * 60 * 60,
      path: '/',
    });

    cookieStore.set('dashboard_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshDurationDays * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

