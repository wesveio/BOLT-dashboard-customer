import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import { withAuth } from '@/lib/api/route-handler';

/**
 * DELETE /api/dashboard/users/[id]
 * Delete a user from the account
 */
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_request, { user }) => {
    try {
      const params = await context.params;
      const { id: userIdToDelete } = params;

      if (!userIdToDelete) {
        return apiError('User ID is required', 400);
      }

      const supabaseAdmin = getSupabaseAdmin();

      if (!user.account_id) {
        return apiError('User account not found', 404);
      }

      // Delete user using RPC function (all validation is done inside the function)
      const { data: deleteResult, error: deleteError } = await supabaseAdmin.rpc(
        'delete_user',
        {
          p_user_id: userIdToDelete,
          p_deleter_user_id: user.id,
        }
      );

      if (deleteError) {
        console.error('Delete user error:', deleteError);
        if (deleteError.message?.includes('not found')) {
          return apiError('User not found', 404);
        }
        if (deleteError.message?.includes('cannot delete')) {
          return apiError(deleteError.message, 400);
        }
        if (deleteError.message?.includes('Insufficient permissions')) {
          return apiError(deleteError.message, 403);
        }
        return apiError('Failed to delete user', 500);
      }

      return apiSuccess({
        message: 'User deleted successfully',
      });
    } catch (error) {
      return apiInternalError(error);
    }
  })(request, context);
}

