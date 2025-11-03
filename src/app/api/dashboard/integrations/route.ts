import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, withAuthAndValidation } from '@/lib/api/route-handler';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/responses';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  generateApiKey,
  hashApiKey,
  extractKeyParts,
} from '@/utils/auth/api-key-generator';

const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

/**
 * GET /api/dashboard/integrations
 * Get all API keys for the authenticated user's account (masked)
 */
export const GET = withAuth(async (_request: NextRequest, { user }) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get API keys for this account using RPC function
    const { data: apiKeys, error: apiKeysError } = await supabaseAdmin.rpc(
      'get_api_keys_by_account',
      { p_account_id: user.account_id }
    );

    if (apiKeysError) {
      console.error('Get API keys error:', apiKeysError);
      return apiError('Failed to fetch API keys', 500);
    }

    return apiSuccess({
      apiKeys: apiKeys || [],
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    return apiError('Internal server error', 500);
  }
});

/**
 * POST /api/dashboard/integrations
 * Create a new custom API key (admin/owner only)
 */
export const POST = withAuthAndValidation(
  createApiKeySchema,
  async (_request: NextRequest, { user, body }) => {
    try {
      // Check permissions: only admin and owner can create API keys
      if (user.role !== 'admin' && user.role !== 'owner') {
        return apiUnauthorized('Only administrators can create API keys');
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Generate new API key
      const apiKey = generateApiKey(32);
      const keyHash = hashApiKey(apiKey);
      const { prefix, suffix } = extractKeyParts(apiKey);

      // Create custom API key using RPC function
      const { data: createdKeys, error: createError } = await supabaseAdmin.rpc(
        'create_custom_api_key',
        {
          p_account_id: user.account_id,
          p_name: body.name,
          p_description: body.description || null,
          p_key_hash: keyHash,
          p_key_prefix: prefix,
          p_key_suffix: suffix,
          p_created_by: user.id,
        }
      );

      const createdKey = createdKeys && createdKeys.length > 0 ? createdKeys[0] : null;

      if (createError || !createdKey) {
        console.error('Create API key error:', createError);
        return apiError('Failed to create API key', 500);
      }

      // Return the created key with the full API key (only shown once)
      return apiSuccess(
        {
          apiKey: {
            ...createdKey,
            // Include full key only in this response (client must save it)
            key: apiKey,
          },
        },
        201
      );
    } catch (error) {
      console.error('Create API key error:', error);
      return apiError('Internal server error', 500);
    }
  }
);

