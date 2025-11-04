import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import { getAuthenticatedUser, AuthError } from '@/lib/api/auth';
import { canRoleInviteUsers } from '@/utils/users';
import { getEmailService } from '@/utils/auth/email-service';
import { generateInvitationEmail } from '@/utils/auth/email-service';

/**
 * POST /api/dashboard/users/invitations/[id]/resend
 * Resend an invitation email
 */
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthenticatedUser();
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return apiError('Invitation ID is required', 400);
    }

    // Check permissions - only owners and admins can resend invitations
    if (!canRoleInviteUsers(user.role as 'owner' | 'admin')) {
      return apiError('Insufficient permissions to resend invitations', 403);
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    // Resend invitation using RPC function
    const { data: invitationData, error: resendError } = await supabaseAdmin.rpc(
      'resend_user_invitation',
      { p_invitation_id: id }
    );

    if (resendError || !invitationData || invitationData.length === 0) {
      console.error('Resend invitation error:', resendError);
      if (resendError?.message?.includes('not found') || resendError?.message?.includes('already accepted')) {
        return apiError('Invitation not found or already accepted', 404);
      }
      return apiError('Failed to resend invitation', 500);
    }

    const invitation = invitationData[0];

    // Verify invitation belongs to user's account
    const { data: invitations, error: checkError } = await supabaseAdmin.rpc(
      'get_user_invitations_by_account',
      { p_account_id: user.account_id }
    );

    if (!checkError && invitations) {
      const invitationExists = invitations.some((inv: { id: string }) => inv.id === invitation.id);
      if (!invitationExists) {
        return apiError('Invitation not found', 404);
      }
    }

    // Send invitation email
    try {
      const emailService = getEmailService();
      const inviterName = user.name || user.email || 'Team Member';
      const locale = 'en'; // TODO: Get from user preferences or request
      const { html, text, subject } = generateInvitationEmail(
        invitation.token,
        inviterName,
        invitation.role,
        locale
      );

      await emailService.sendEmail({
        to: invitation.email,
        subject,
        html,
        text,
      });
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Don't fail the request if email fails
    }

    return apiSuccess({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        updatedAt: invitation.updated_at,
      },
      message: 'Invitation resent successfully',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiInternalError(error);
  }
}

