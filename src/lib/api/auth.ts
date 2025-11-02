import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthBypassEnabled, getMockUser } from '@/utils/auth/dev-bypass';

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
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
    throw new AuthError('Not authenticated', 401);
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Find session using RPC function (required for custom schema)
  const { data: sessions, error: sessionError } = await supabaseAdmin
    .rpc('get_session_by_token', { p_token: sessionToken });

  const session = sessions && sessions.length > 0 ? sessions[0] : null;

  if (sessionError || !session) {
    console.error('🚨 [DEBUG] Session error:', sessionError);
    throw new AuthError('Invalid or expired session', 401);
  }

  // Validate session expiration (RPC already filters expired, but double-check)
  if (new Date(session.expires_at) < new Date()) {
    throw new AuthError('Session expired', 401);
  }

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

