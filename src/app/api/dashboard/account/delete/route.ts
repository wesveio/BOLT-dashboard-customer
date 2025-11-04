import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/route-handler';

/**
 * DELETE /api/dashboard/account/delete
 * Soft delete (cancel) the authenticated user's account
 * Only owners and admins can delete accounts
 */
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  return withAuth(async (_request, { user }) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      if (!user.account_id) {
        return apiError('User account not found', 404);
      }

      // Validate user has owner or admin role (additional check on API level)
      if (user.role !== 'owner' && user.role !== 'admin') {
        return apiError('Insufficient permissions to delete this account', 403);
      }

      // Delete account using RPC function (all validation is done inside the function)
      const { error: deleteError } = await supabaseAdmin.rpc('delete_account', {
        p_account_id: user.account_id,
        p_user_id: user.id,
      });

      if (deleteError) {
        console.error('Delete account error:', deleteError);
        if (deleteError.message?.includes('not found')) {
          return apiError('Account not found', 404);
        }
        if (deleteError.message?.includes('already cancelled')) {
          return apiError('Account is already cancelled', 400);
        }
        if (deleteError.message?.includes('Insufficient permissions')) {
          return apiError(deleteError.message, 403);
        }
        return apiError('Failed to delete account', 500);
      }

      return apiSuccess({
        message: 'Account deleted successfully',
      });
    } catch (error) {
      return apiInternalError(error);
    }
  })(request);
}

