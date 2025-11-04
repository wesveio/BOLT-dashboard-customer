import { getSupabaseAdmin } from '@/lib/supabase';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/route-handler';
import { canRoleInviteUsers } from '@/utils/users';

/**
 * GET /api/dashboard/users/invitations
 * List pending invitations for the current account
 */
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, { user }) => {
  try {
    // Check permissions - only owners and admins can view invitations
    if (!canRoleInviteUsers(user.role as 'owner' | 'admin')) {
      return apiError('Insufficient permissions to view invitations', 403);
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    // Get invitations by account using RPC function
    const { data: invitations, error: invitationsError } = await supabaseAdmin.rpc(
      'get_user_invitations_by_account',
      { p_account_id: user.account_id }
    );

    if (invitationsError) {
      console.error('Get invitations error:', invitationsError);
      return apiError('Failed to fetch invitations', 500);
    }

    return apiSuccess({
      invitations: invitations || [],
    });
  } catch (error) {
    return apiInternalError(error);
  }
});

