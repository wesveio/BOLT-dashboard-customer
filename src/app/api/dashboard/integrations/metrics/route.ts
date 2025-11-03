import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/route-handler';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/responses';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  generateApiKey,
  hashApiKey,
  extractKeyParts,
} from '@/utils/auth/api-key-generator';

/**
 * GET /api/dashboard/integrations/metrics
 * Get metrics API key (masked) for account
 */
export const GET = withAuth(async (_request: NextRequest, { user }) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Get metrics API key for this account using RPC function
    const { data: metricsKeys, error: metricsError } = await supabaseAdmin.rpc(
      'get_metrics_api_key',
      { p_account_id: user.account_id }
    );

    if (metricsError) {
      console.error('Get metrics API key error:', metricsError);
      return apiError('Failed to fetch metrics API key', 500);
    }

    const metricsKey = metricsKeys && metricsKeys.length > 0 ? metricsKeys[0] : null;

    return apiSuccess({
      metricsKey: metricsKey || null,
    });
  } catch (error) {
    console.error('Get metrics API key error:', error);
    return apiError('Internal server error', 500);
  }
});

/**
 * POST /api/dashboard/integrations/metrics
 * Regenerate metrics API key (admin/owner only)
 * Auto-creates if doesn't exist
 */
export const POST = withAuth(async (_request: NextRequest, { user }) => {
  try {
    // Check permissions: only admin and owner can regenerate metrics API key
    if (user.role !== 'admin' && user.role !== 'owner') {
      return apiUnauthorized('Only administrators can regenerate the metrics API key');
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Generate new metrics API key
    const apiKey = generateApiKey(32);
    const keyHash = hashApiKey(apiKey);
    const { prefix, suffix } = extractKeyParts(apiKey);

    // Create or update metrics API key using RPC function
    const { data: updatedKeys, error: updateError } = await supabaseAdmin.rpc(
      'upsert_metrics_api_key',
      {
        p_account_id: user.account_id,
        p_key_hash: keyHash,
        p_key_prefix: prefix,
        p_key_suffix: suffix,
        p_created_by: user.id,
      }
    );

    const updatedKey = updatedKeys && updatedKeys.length > 0 ? updatedKeys[0] : null;

    if (updateError || !updatedKey) {
      console.error('Regenerate metrics API key error:', updateError);
      return apiError('Failed to regenerate metrics API key', 500);
    }

    // Return the updated key with the full API key (only shown once)
    return apiSuccess({
      metricsKey: {
        ...updatedKey,
        // Include full key only in this response (client must save it)
        key: apiKey,
      },
    });
  } catch (error) {
    console.error('Regenerate metrics API key error:', error);
    return apiError('Internal server error', 500);
  }
});

