import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, withAuthAndValidation } from '@/lib/api/route-handler';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/responses';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Simple encryption/decryption for VTEX credentials
 * In production, consider using a more robust solution like AWS KMS or similar
 */
function encryptCredential(credential: string): string {
  // Simple base64 encoding for now - in production use proper encryption
  // TODO: Implement proper encryption (e.g., using crypto module)
  return Buffer.from(credential).toString('base64');
}

function decryptCredential(encrypted: string): string {
  // Simple base64 decoding for now
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

function maskCredential(credential: string): string {
  if (!credential || credential.length < 4) return '••••';
  if (credential.length <= 8) return '••••••••';
  return `${credential.slice(0, 4)}...${credential.slice(-4)}`;
}

const vtexCredentialsSchema = z.object({
  app_key: z.string().min(1, 'App Key is required'),
  app_token: z.string().min(1, 'App Token is required'),
});

/**
 * GET /api/dashboard/integrations/vtex
 * Get VTEX credentials for the authenticated user's account
 * Returns full credentials for admin/owner, masked for other roles
 */
export const GET = withAuth(async (_request: NextRequest, { user }) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get VTEX credentials for this account using RPC function
    const { data: credentials, error: credentialsError } = await supabaseAdmin.rpc(
      'get_vtex_credentials',
      { p_account_id: user.account_id }
    );

    if (credentialsError) {
      // Check if error is due to missing table (relation does not exist)
      const isTableMissing = credentialsError.code === '42P01' ||
        (credentialsError.message && credentialsError.message.includes('does not exist'));

      if (isTableMissing) {
        console.warn('⚠️ [DEBUG] VTEX credentials table not found. Please run migration 058_vtex_credentials.sql');
        return apiSuccess({
          credentials: null,
        });
      }

      console.error('❌ [DEBUG] Error fetching VTEX credentials:', credentialsError);
      return apiError('Failed to fetch VTEX credentials', 500);
    }

    const credential = credentials && credentials.length > 0 ? credentials[0] : null;

    if (!credential) {
      return apiSuccess({
        credentials: null,
      });
    }

    // Check if user is admin or owner - they can see full credentials
    const canViewFullCredentials = user.role === 'admin' || user.role === 'owner';

    if (canViewFullCredentials) {
      // Return full credentials for admin/owner
      return apiSuccess({
        credentials: {
          id: credential.id,
          account_id: credential.account_id,
          app_key: decryptCredential(credential.app_key_encrypted),
          app_token: decryptCredential(credential.app_token_encrypted),
          created_at: credential.created_at,
          updated_at: credential.updated_at,
        },
      });
    } else {
      // Return masked credentials for other roles
      const decryptedKey = decryptCredential(credential.app_key_encrypted);
      const decryptedToken = decryptCredential(credential.app_token_encrypted);
      
      return apiSuccess({
        credentials: {
          id: credential.id,
          account_id: credential.account_id,
          app_key: maskCredential(decryptedKey),
          app_token: maskCredential(decryptedToken),
          created_at: credential.created_at,
          updated_at: credential.updated_at,
        },
      });
    }
  } catch (error) {
    console.error('❌ [DEBUG] Error in VTEX credentials GET API:', error);
    return apiError('Internal server error', 500);
  }
});

/**
 * PATCH /api/dashboard/integrations/vtex
 * Save or update VTEX credentials (admin/owner only)
 */
export const PATCH = withAuthAndValidation(
  vtexCredentialsSchema,
  async (_request: NextRequest, { user, body }) => {
    try {
      // Check permissions: only admin and owner can save/update credentials
      if (user.role !== 'admin' && user.role !== 'owner') {
        return apiUnauthorized('Only administrators can save VTEX credentials');
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Encrypt credentials before storing
      const encryptedKey = encryptCredential(body.app_key.trim());
      const encryptedToken = encryptCredential(body.app_token.trim());

      // Upsert credentials using RPC function
      const { data: credentialId, error: upsertError } = await supabaseAdmin.rpc(
        'upsert_vtex_credentials',
        {
          p_account_id: user.account_id,
          p_app_key: encryptedKey,
          p_app_token: encryptedToken,
        }
      );

      if (upsertError || !credentialId) {
        console.error('❌ [DEBUG] Error upserting VTEX credentials:', upsertError);
        return apiError('Failed to save VTEX credentials', 500);
      }

      // Get updated credentials to return
      const { data: updatedCredentials, error: fetchError } = await supabaseAdmin.rpc(
        'get_vtex_credentials',
        { p_account_id: user.account_id }
      );

      if (fetchError || !updatedCredentials || updatedCredentials.length === 0) {
        console.error('❌ [DEBUG] Error fetching updated VTEX credentials:', fetchError);
        return apiError('Failed to retrieve updated credentials', 500);
      }

      const credential = updatedCredentials[0];

      // Return full credentials (user is admin/owner, so they can see them)
      return apiSuccess({
        credentials: {
          id: credential.id,
          account_id: credential.account_id,
          app_key: decryptCredential(credential.app_key_encrypted),
          app_token: decryptCredential(credential.app_token_encrypted),
          created_at: credential.created_at,
          updated_at: credential.updated_at,
        },
        message: 'VTEX credentials saved successfully',
      });
    } catch (error) {
      console.error('❌ [DEBUG] Error in VTEX credentials PATCH API:', error);
      return apiError('Internal server error', 500);
    }
  }
);

/**
 * DELETE /api/dashboard/integrations/vtex
 * Delete VTEX credentials (admin/owner only)
 */
export const DELETE = withAuth(async (_request: NextRequest, { user }) => {
  try {
    // Check permissions: only admin and owner can delete credentials
    if (user.role !== 'admin' && user.role !== 'owner') {
      return apiUnauthorized('Only administrators can delete VTEX credentials');
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Delete credentials using RPC function
    const { data: deleted, error: deleteError } = await supabaseAdmin.rpc(
      'delete_vtex_credentials',
      { p_account_id: user.account_id }
    );

    if (deleteError) {
      console.error('❌ [DEBUG] Error deleting VTEX credentials:', deleteError);
      return apiError('Failed to delete VTEX credentials', 500);
    }

    if (!deleted) {
      return apiError('VTEX credentials not found', 404);
    }

    return apiSuccess({
      message: 'VTEX credentials deleted successfully',
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in VTEX credentials DELETE API:', error);
    return apiError('Internal server error', 500);
  }
});

