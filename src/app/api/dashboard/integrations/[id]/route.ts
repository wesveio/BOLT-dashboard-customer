import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/route-handler';
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from '@/lib/api/responses';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { AuthResult } from '@/lib/api/auth';

/**
 * DELETE /api/dashboard/integrations/[id]
 * Delete custom API key by ID (admin/owner only)
 * Cannot delete metrics key via this endpoint
 */
export const dynamic = 'force-dynamic';
export const DELETE = withAuth(
  async (
    _request: NextRequest,
    { user, params }: AuthResult & { params?: Record<string, string> }
  ) => {
    try {
      // Check permissions: only admin and owner can delete API keys
      if (user.role !== 'admin' && user.role !== 'owner') {
        return apiUnauthorized('Only administrators can delete API keys');
      }

      const keyId = params?.id;

      if (!keyId) {
        return apiError('API key ID is required', 400);
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Delete API key using RPC function (only allows deleting custom keys)
      const { data: deleted, error: deleteError } = await supabaseAdmin.rpc(
        'delete_api_key',
        {
          p_key_id: keyId,
          p_account_id: user.account_id,
        }
      );

      if (deleteError) {
        console.error('Delete API key error:', deleteError);
        return apiError('Failed to delete API key', 500);
      }

      if (!deleted) {
        return apiNotFound('API key not found or cannot be deleted');
      }

      return apiSuccess({
        success: true,
        message: 'API key deleted successfully',
      });
    } catch (error) {
      console.error('Delete API key error:', error);
      return apiError('Internal server error', 500);
    }
  }
);

