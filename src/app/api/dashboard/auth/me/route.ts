import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { isAuthBypassEnabled, getMockUser } from '@/utils/auth/dev-bypass';
import { getAuthenticatedUserOrNull } from '@/lib/api/auth';
import { apiSuccess, apiUnauthorized, apiInternalError } from '@/lib/api/responses';
import { getSessionDurationHours, getSessionDurationSeconds } from '@/utils/auth/session-config';

/**
 * GET /api/dashboard/auth/me
 * Get current authenticated user
 */
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest) {
  try {
    // Development bypass - only works in development mode
    if (isAuthBypassEnabled()) {
      console.warn('‼️ [DEBUG] Auth bypass enabled - returning mock user');
      const mockUser = getMockUser();

      // Get session duration from environment variable
      const sessionDurationHours = getSessionDurationHours();
      const cookieMaxAge = getSessionDurationSeconds();

      // Set a mock session cookie to maintain consistency
      const cookieStore = cookies();
      cookieStore.set('dashboard_session', 'dev-bypass-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: cookieMaxAge,
        path: '/',
      });

      console.info(`✅ [DEBUG] Session cookie set with duration: ${sessionDurationHours} hours (${cookieMaxAge} seconds)`);

      return apiSuccess({ user: mockUser });
    }

    console.info('✅ [DEBUG] /api/dashboard/auth/me - Checking authentication...');
    const authResult = await getAuthenticatedUserOrNull();
    
    if (!authResult) {
      console.warn('⚠️ [DEBUG] /api/dashboard/auth/me - Authentication failed: No auth result');
      return apiUnauthorized('Not authenticated');
    }

    console.info('✅ [DEBUG] /api/dashboard/auth/me - Authentication successful');

    const { user } = authResult;
    const supabaseAdmin = getSupabaseAdmin();

    // Get VTEX account name if user has an account
    // Use RPC function to query customer.accounts table
    let vtexAccountName: string | null = null;
    if (user.account_id) {
      try {
        const { data: accounts, error: accountError } = await supabaseAdmin
          .rpc('get_account_by_id', { p_account_id: user.account_id });

        if (!accountError && accounts && accounts.length > 0) {
          vtexAccountName = accounts[0].vtex_account_name;
        } else if (accountError) {
          // Function might not exist yet - log but continue
          if (accountError.code === 'PGRST202') {
            console.warn('⚠️ [DEBUG] Function get_account_by_id not found. Please run migration 010_add_get_account_by_id_function.sql');
          } else {
            console.warn('⚠️ [DEBUG] Could not fetch VTEX account name:', accountError);
          }
        }
      } catch (error) {
        // Silently continue if function doesn't exist yet
        console.warn('⚠️ [DEBUG] Error fetching VTEX account name:', error);
      }
    }

    // Note: RPC function get_user_by_id doesn't include phone, company, job_title
    // These fields were added later. We need to use SQL or update the function.
    // For now, returning available fields from RPC function
    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone || null,
        company: user.company || null,
        jobTitle: user.job_title || null,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login || null,
        accountId: user.account_id,
        vtexAccountName: vtexAccountName,
      },
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

