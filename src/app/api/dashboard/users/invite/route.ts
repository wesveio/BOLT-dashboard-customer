import { headers } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import { withAuthAndValidation } from '@/lib/api/route-handler';
import { canRoleInviteUsers, isValidEmail, isValidRole, getPlanUserLimit, canInviteUser } from '@/utils/users';
import { getEmailService } from '@/utils/auth/email-service';
import { generateInvitationEmail } from '@/utils/auth/email-service';
import { routing } from '@/i18n/routing';

const inviteSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['owner', 'admin', 'editor', 'viewer']),
});

/**
 * POST /api/dashboard/users/invite
 * Create a new user invitation
 */
export const dynamic = 'force-dynamic';

export const POST = withAuthAndValidation(
  inviteSchema,
  async (_request, { user, body }) => {
    try {
      // Check permissions - only owners and admins can invite
      if (!canRoleInviteUsers(user.role as 'owner' | 'admin')) {
        return apiError('Insufficient permissions to invite users', 403);
      }

      const supabaseAdmin = getSupabaseAdmin();

      if (!user.account_id) {
        return apiError('User account not found', 404);
      }

      // Validate email format
      if (!isValidEmail(body.email)) {
        return apiError('Invalid email format', 400);
      }

      // Validate role
      if (!isValidRole(body.role)) {
        return apiError('Invalid role', 400);
      }

      // Check if user already exists with this email
      const { data: existingUser, error: userCheckError } = await supabaseAdmin.rpc(
        'get_user_by_email',
        { p_email: body.email }
      );

      if (userCheckError && userCheckError.code !== 'PGRST202') {
        console.error('Check existing user error:', userCheckError);
      }

      if (existingUser && existingUser.length > 0) {
        const existingUserData = existingUser[0];
        if (existingUserData.account_id === user.account_id) {
          return apiError('User already exists in this account', 400);
        }
        // Check if email is already used in another account
        return apiError('Email is already registered', 400);
      }

      // Check if there's already a pending invitation for this email
      const { data: existingInvitations, error: invCheckError } = await supabaseAdmin.rpc(
        'get_user_invitations_by_account',
        { p_account_id: user.account_id }
      );

      if (!invCheckError && existingInvitations) {
        const pendingInvitation = existingInvitations.find(
          (inv: { email: string; status: string }) =>
            inv.email.toLowerCase() === body.email.toLowerCase() && inv.status === 'pending'
        );
        if (pendingInvitation) {
          return apiError('Invitation already sent to this email', 400);
        }
      }

      // Get account info to check plan limits
      const { data: accountData, error: accountError } = await supabaseAdmin.rpc(
        'get_account_by_id',
        { p_account_id: user.account_id }
      );

      if (accountError || !accountData || accountData.length === 0) {
        return apiError('Account not found', 404);
      }

      const account = accountData[0];
      const planType = account.plan_type || 'basic';

      // Get current user count
      const { data: userCountData, error: countError } = await supabaseAdmin.rpc(
        'get_account_user_count',
        { p_account_id: user.account_id }
      );

      if (countError) {
        console.error('Get user count error:', countError);
        return apiError('Failed to check user limit', 500);
      }

      const currentCount = userCountData || 0;
      const limit = getPlanUserLimit(planType as 'basic' | 'pro' | 'enterprise');

      // Check if we can invite more users
      if (!canInviteUser(currentCount, planType as 'basic' | 'pro' | 'enterprise')) {
        return apiError(
          `User limit reached for ${planType} plan (${currentCount}/${limit}). Please upgrade your plan to invite more users.`,
          400
        );
      }

      // Create invitation
      const { data: invitationData, error: invitationError } = await supabaseAdmin.rpc(
        'create_user_invitation',
        {
          p_account_id: user.account_id,
          p_email: body.email,
          p_role: body.role,
          p_created_by: user.id,
        }
      );

      if (invitationError || !invitationData || invitationData.length === 0) {
        console.error('Create invitation error:', invitationError);
        return apiError('Failed to create invitation', 500);
      }

      const invitation = invitationData[0];

      // Send invitation email
      try {
        const emailService = getEmailService();
        const inviterName = user.name || user.email || 'Team Member';
        
        // Get locale from user preferences, request header, or default
        const headersList = headers();
        const userSettings = (user.settings || {}) as Record<string, any>;
        const settingsLocale = userSettings?.general?.language;
        const headerLocale = headersList.get('x-locale');
        const detectedLocale = settingsLocale || headerLocale || routing.defaultLocale;
        const locale = routing.locales.includes(detectedLocale as any) 
          ? detectedLocale 
          : routing.defaultLocale;
        
        const { html, text, subject } = generateInvitationEmail(
          invitation.token,
          inviterName,
          body.role,
          locale
        );

        await emailService.sendEmail({
          to: body.email,
          subject,
          html,
          text,
        });
      } catch (emailError) {
        console.error('Email service error:', emailError);
        // Don't fail the request if email fails, but log it
        // The invitation is still created and can be resent
      }

      return apiSuccess({
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expires_at,
          createdAt: invitation.created_at,
        },
        message: 'Invitation sent successfully',
      });
    } catch (error) {
      return apiInternalError(error);
    }
  }
);

