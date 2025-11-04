import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';

/**
 * POST /api/dashboard/users/invitations/[id]/accept
 * Accept a user invitation and create the user account
 * Note: The [id] parameter is actually the invitation token (UUID)
 */
export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id: token } = params; // The id parameter is the invitation token

    if (!token) {
      return apiError('Invitation token is required', 400);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Accept invitation using RPC function
    const { data: acceptData, error: acceptError } = await supabaseAdmin.rpc(
      'accept_user_invitation',
      { p_token: token }
    );

    if (acceptError) {
      console.error('Accept invitation error:', acceptError);
      if (acceptError.message?.includes('Invalid or expired')) {
        return apiError('Invalid or expired invitation token', 400);
      }
      if (acceptError.message?.includes('already exists')) {
        return apiError('User already exists with this email', 400);
      }
      return apiError('Failed to accept invitation', 500);
    }

    if (!acceptData || acceptData.length === 0) {
      return apiError('Invitation not found or already accepted', 404);
    }

    const result = acceptData[0];
    const { email } = result;

    return apiSuccess({
      message: 'Invitation accepted successfully. You can now sign in with your email.',
      email,
    });
  } catch (error) {
    return apiInternalError(error);
  }
}

