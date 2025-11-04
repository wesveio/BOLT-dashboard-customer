import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import { getAuthenticatedUser, AuthError } from '@/lib/api/auth';
import { canRoleInviteUsers } from '@/utils/users';

/**
 * DELETE /api/dashboard/users/invitations/[id]
 * Cancel/delete an invitation
 */
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthenticatedUser();
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return apiError('Invitation ID is required', 400);
    }

    // Check permissions - only owners and admins can cancel invitations
    if (!canRoleInviteUsers(user.role as 'owner' | 'admin')) {
      return apiError('Insufficient permissions to cancel invitations', 403);
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    // Verify invitation belongs to user's account before deletion
    const { data: invitations, error: checkError } = await supabaseAdmin.rpc(
      'get_user_invitations_by_account',
      { p_account_id: user.account_id }
    );

    if (checkError) {
      console.error('Get invitations error:', checkError);
      return apiError('Failed to verify invitation', 500);
    }

    if (!invitations) {
      return apiError('Invitation not found', 404);
    }

    const invitationExists = invitations.some((inv: { id: string }) => inv.id === id);
    if (!invitationExists) {
      return apiError('Invitation not found', 404);
    }

    // Check if invitation is already accepted
    const invitation = invitations.find((inv: { id: string }) => inv.id === id);
    if (invitation?.status === 'accepted' || invitation?.accepted_at) {
      return apiError('Cannot cancel an already accepted invitation', 400);
    }

    // Delete invitation from database
    const { error: deleteError } = await supabaseAdmin
      .from('dashboard.user_invitations')
      .delete()
      .eq('id', id)
      .eq('account_id', user.account_id);

    if (deleteError) {
      console.error('Delete invitation error:', deleteError);
      return apiError('Failed to cancel invitation', 500);
    }

    return apiSuccess({
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiInternalError(error);
  }
}

