import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthBypassEnabled, getMockUser } from '@/utils/auth/dev-bypass';
import { getSessionDurationMs } from '@/utils/auth/session-config';

/**
 * Session data returned from RPC function
 */
export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

/**
 * User data returned from RPC function
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  account_id?: string;
  created_at: string;
  updated_at?: string;
  last_login?: string | null;
  settings?: unknown;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
}

/**
 * Authentication result
 */
export interface AuthResult {
  user: User;
  session: Session;
}

/**
 * Custom error class for authentication failures
 */
export class AuthError extends Error {
  constructor(
    public message: string,
    public status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Get authenticated user and session from cookie
 * Returns user and session or throws AuthError
 * 
 * @returns {Promise<AuthResult>} User and session data
 * @throws {AuthError} If authentication fails
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  // Development bypass - only works in development mode
  if (isAuthBypassEnabled()) {
    console.warn('‼️ [DEBUG] Auth bypass enabled - returning mock user');
    const mockUser = getMockUser();

    // Create a mock session object
    const mockSession: Session = {
      id: 'dev-bypass-session',
      user_id: mockUser.id,
      token: 'dev-bypass-token',
      expires_at: new Date(Date.now() + getSessionDurationMs()).toISOString(),
      created_at: new Date().toISOString(),
    };

    return {
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        first_name: mockUser.firstName,
        last_name: mockUser.lastName,
        role: mockUser.role,
        account_id: mockUser.accountId,
        created_at: mockUser.createdAt || new Date().toISOString(),
        updated_at: mockUser.updatedAt || new Date().toISOString(),
        last_login: mockUser.lastLogin || null,
      },
      session: mockSession,
    };
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('dashboard_session')?.value;

  if (!sessionToken) {
    console.warn('⚠️ [DEBUG] No session token found in cookies');
    throw new AuthError('Not authenticated', 401);
  }

  console.info(`✅ [DEBUG] Session token found, validating with database...`);

  const supabaseAdmin = getSupabaseAdmin();

  // Find session using RPC function (required for custom schema)
  // RPC function already filters expired sessions (expires_at > NOW())
  const { data: sessions, error: sessionError } = await supabaseAdmin
    .rpc('get_session_by_token', { p_token: sessionToken });

  const session = sessions && sessions.length > 0 ? sessions[0] : null;

  if (sessionError) {
    console.error('🚨 [DEBUG] Session query error:', sessionError);
    throw new AuthError('Invalid or expired session', 401);
  }

  if (!session) {
    console.warn('⚠️ [DEBUG] Session not found or expired in database');
    throw new AuthError('Invalid or expired session', 401);
  }

  // Validate session expiration with timezone-safe comparison
  // Add a 5-second buffer to account for clock skew and timezone differences
  const now = new Date();
  const expiresAt = new Date(session.expires_at);
  const bufferMs = 5000; // 5 seconds buffer
  const timeUntilExpiry = expiresAt.getTime() - now.getTime();
  const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
  const minutesUntilExpiry = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));

  // Since RPC already filters expired sessions, this check is mainly for logging
  // We use a buffer to avoid false positives due to timezone differences
  if (timeUntilExpiry < -bufferMs) {
    console.warn(`⚠️ [DEBUG] Session expired (with buffer). Expires at: ${expiresAt.toISOString()}, Now: ${now.toISOString()}, Diff: ${timeUntilExpiry}ms`);
    throw new AuthError('Session expired', 401);
  }

  console.info(`✅ [DEBUG] Session valid. Expires at: ${expiresAt.toISOString()}, Now: ${now.toISOString()}, Time until expiry: ${hoursUntilExpiry}h ${minutesUntilExpiry}m`);

  // Get user details using RPC function (required for custom schema)
  const { data: users, error: userError } = await supabaseAdmin
    .rpc('get_user_by_id', { p_user_id: session.user_id });

  const user = users && users.length > 0 ? users[0] : null;

  if (userError || !user) {
    console.error('🚨 [DEBUG] User query error:', userError);
    throw new AuthError('User not found', 404);
  }

  return {
    user,
    session,
  };
}

/**
 * Get authenticated user and session from cookie (nullable version)
 * Returns user and session or null if not authenticated
 * Use this when you want to handle unauthenticated state gracefully
 * 
 * @returns {Promise<AuthResult | null>} User and session data, or null if not authenticated
 */
export async function getAuthenticatedUserOrNull(): Promise<AuthResult | null> {
  try {
    return await getAuthenticatedUser();
  } catch (error) {
    // Return null instead of throwing for graceful error handling
    if (error instanceof AuthError) {
      return null;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Validate session expiration with timezone-safe comparison
 * Adds a buffer to account for clock skew and timezone differences
 * 
 * @param expiresAt - Session expiration date as ISO string
 * @param bufferMs - Buffer in milliseconds (default: 5000ms / 5 seconds)
 * @returns true if session is valid, false if expired
 */
export function isSessionValid(expiresAt: string, bufferMs: number = 5000): boolean {
  const now = new Date();
  const expires = new Date(expiresAt);
  const timeUntilExpiry = expires.getTime() - now.getTime();
  
  // Session is valid if time until expiry is greater than negative buffer
  // This accounts for small clock differences and timezone issues
  return timeUntilExpiry >= -bufferMs;
}

/**
 * Require authentication - returns NextResponse error if auth fails
 * Otherwise returns the auth result
 * 
 * @returns {Promise<NextResponse | AuthResult>} Error response or auth data
 */
export async function requireAuth(): Promise<NextResponse | AuthResult> {
  try {
    const result = await getAuthenticatedUser();
    return result;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error('Unexpected auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

