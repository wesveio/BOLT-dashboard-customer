import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyCode } from '@/utils/auth/code-generator';
import { generateSessionToken } from '@/utils/auth/code-generator';
import { cookies } from 'next/headers';
import { isAuthBypassEnabled, getMockUser } from '@/utils/auth/dev-bypass';
import {
  getSessionDurationHours,
  getRefreshTokenDurationDays,
  getSessionDurationSeconds,
  getRefreshTokenDurationSeconds,
  calculateSessionExpiration,
  calculateRefreshTokenExpiration,
} from '@/utils/auth/session-config';

const verifyCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

/**
 * POST /api/dashboard/auth/verify-code
 * Verify access code and create session (passwordless auth)
 */
export const dynamic = 'force-dynamic';

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

      // Set HTTP-only cookies
      const cookieStore = await cookies();
      const cookieMaxAge = getSessionDurationSeconds();
      cookieStore.set('dashboard_session', sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: cookieMaxAge,
        path: '/',
      });

      const refreshCookieMaxAge = getRefreshTokenDurationSeconds();
      cookieStore.set('dashboard_refresh', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: refreshCookieMaxAge,
        path: '/',
      });

      return NextResponse.json({
        success: true,
        user: mockUser,
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Find valid auth code
    const { data: authCodes, error: findError } = await supabaseAdmin
      .rpc('get_auth_code_for_verification', { p_email: email });

    const authCode = authCodes && authCodes.length > 0 ? authCodes[0] : null;

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
        .rpc('increment_auth_code_attempts', { p_code_id: authCode.id });

      return NextResponse.json(
        { error: 'Invalid code. Please try again.' },
        { status: 401 }
      );
    }

    // Mark code as used
    await supabaseAdmin
      .rpc('mark_auth_code_used', { p_code_id: authCode.id });

    // Find user
    const { data: users, error: userError } = await supabaseAdmin
      .rpc('get_user_by_email', { p_email: email });

    const user = users && users.length > 0 ? users[0] : null;

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

    const sessionDurationHours = getSessionDurationHours();
    const refreshDurationDays = getRefreshTokenDurationDays();

    const expiresAt = calculateSessionExpiration();
    const refreshExpiresAt = calculateRefreshTokenExpiration();

    console.info(`✅ [DEBUG] Creating session for user ${user.email}`);
    console.info(`✅ [DEBUG] Session duration: ${sessionDurationHours} hours`);
    console.info(`✅ [DEBUG] Session expires at: ${expiresAt.toISOString()}`);
    console.info(`✅ [DEBUG] Refresh token expires at: ${refreshExpiresAt.toISOString()}`);

    // Store session
    const { error: sessionError } = await supabaseAdmin
      .rpc('create_session', {
        p_user_id: user.id,
        p_token: sessionToken,
        p_refresh_token: refreshToken,
        p_expires_at: expiresAt.toISOString(),
        p_refresh_expires_at: refreshExpiresAt.toISOString(),
        p_ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        p_user_agent: request.headers.get('user-agent') || 'unknown',
      });

    if (sessionError) {
      console.error('❌ [DEBUG] Session creation error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    console.info(`✅ [DEBUG] Session created successfully`);

    // Update user last login
    await supabaseAdmin
      .rpc('update_user_last_login', { p_user_id: user.id });

    // Set HTTP-only cookies
    const cookieStore = await cookies();
    const cookieMaxAge = getSessionDurationSeconds();
    cookieStore.set('dashboard_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    const refreshCookieMaxAge = getRefreshTokenDurationSeconds();
    cookieStore.set('dashboard_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshCookieMaxAge,
      path: '/',
    });

    console.info(`✅ [DEBUG] Session cookie set with maxAge: ${cookieMaxAge} seconds (${sessionDurationHours} hours)`);
    console.info(`✅ [DEBUG] Refresh cookie set with maxAge: ${refreshCookieMaxAge} seconds (${refreshDurationDays} days)`);

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
        { error: 'Invalid request data', details: error.issues },
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

