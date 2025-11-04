import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/route-handler';
import { canRoleInviteUsers } from '@/utils/users';

/**
 * GET /api/dashboard/users
 * List users for the current account
 */
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { user }) => {
  try {
    // Check permissions - only owners and admins can view users
    if (!canRoleInviteUsers(user.role as 'owner' | 'admin')) {
      return apiError('Insufficient permissions to view users', 403);
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    // Get users by account using RPC function
    const { data: users, error: usersError } = await supabaseAdmin.rpc(
      'get_users_by_account',
      { p_account_id: user.account_id }
    );

    if (usersError) {
      console.error('Get users error:', usersError);
      return apiError('Failed to fetch users', 500);
    }

    // Get account info to get plan type and user count
    const { data: accountData, error: accountError } = await supabaseAdmin
      .rpc('get_account_by_id', { p_account_id: user.account_id });

    if (accountError) {
      console.error('Get account error:', accountError);
    }

    const account = accountData && accountData.length > 0 ? accountData[0] : null;
    const planType = account?.plan_type || 'basic';

    // Get user count
    const { data: userCountData, error: countError } = await supabaseAdmin.rpc(
      'get_account_user_count',
      { p_account_id: user.account_id }
    );

    const userCount = userCountData || 0;

    return apiSuccess({
      users: users || [],
      count: userCount,
      planType,
    });
  } catch (error) {
    return apiInternalError(error);
  }
});

