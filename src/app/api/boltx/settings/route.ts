import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';

export const dynamic = 'force-dynamic';

/**
 * Simple encryption/decryption for API keys
 * In production, consider using a more robust solution like AWS KMS or similar
 */
function encryptApiKey(key: string): string {
  // Simple base64 encoding for now - in production use proper encryption
  // TODO: Implement proper encryption (e.g., using crypto module)
  return Buffer.from(key).toString('base64');
}

function decryptApiKey(encrypted: string): string {
  // Simple base64 decoding for now
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

function maskApiKey(key: string): string {
  if (!key || key.length < 4) return '••••';
  return `sk-...${key.slice(-4)}`;
}

/**
 * GET /api/boltx/settings
 * Retrieve BoltX configuration for the current account
 */
export async function GET(request: NextRequest) {
  try {
    // Check Enterprise plan access
    const { hasEnterpriseAccess, error: planError } = await getUserPlan();
    if (!hasEnterpriseAccess) {
      return apiError(
        planError || 'BoltX is only available on Enterprise plan. Please upgrade to access this feature.',
        403
      );
    }

    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get configuration from database
    const { data: configs, error: configError } = await supabaseAdmin
      .rpc('get_boltx_configuration', { p_customer_id: user.account_id });

    if (configError) {
      // Check if error is due to missing table (relation does not exist)
      const isTableMissing = configError.code === '42P01' || 
        (configError.message && configError.message.includes('does not exist'));
      
      if (isTableMissing) {
        console.warn('⚠️ [DEBUG] BoltX configuration table not found. Using default configuration. Please run migrations 041 and 042.');
      } else {
        console.error('❌ [DEBUG] Error fetching BoltX configuration:', configError);
      }
      // Return defaults based on ENV if no config exists
      return apiSuccess({
        configuration: getDefaultConfiguration(),
      });
    }

    const config = configs && configs.length > 0 ? configs[0] : null;

    if (!config) {
      // Return defaults based on ENV
      return apiSuccess({
        configuration: getDefaultConfiguration(),
      });
    }

    // Mask API key in response
    const maskedConfig = {
      ...config,
      openai_api_key_masked: config.openai_api_key_encrypted
        ? maskApiKey(decryptApiKey(config.openai_api_key_encrypted))
        : null,
      openai_api_key_encrypted: undefined, // Don't send encrypted key to client
    };

    return apiSuccess({
      configuration: maskedConfig,
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in BoltX settings GET API:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * PATCH /api/boltx/settings
 * Update BoltX configuration for the current account
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check Enterprise plan access
    const { hasEnterpriseAccess, error: planError } = await getUserPlan();
    if (!hasEnterpriseAccess) {
      return apiError(
        planError || 'BoltX is only available on Enterprise plan. Please upgrade to access this feature.',
        403
      );
    }

    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const body = await request.json();
    const {
      enabled,
      ai_provider,
      openai_api_key,
      openai_model,
      openai_max_tokens,
      openai_temperature,
      cache_enabled,
      cache_ttl,
      rate_limit,
      prediction_model_version,
      metadata,
    } = body;

    // Validation
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return apiError('enabled must be a boolean', 400);
    }

    if (ai_provider !== undefined && !['openai', 'local'].includes(ai_provider)) {
      return apiError('ai_provider must be "openai" or "local"', 400);
    }

    // If provider is openai and enabled, API key is required
    const finalProvider = ai_provider || 'openai';
    const finalEnabled = enabled !== undefined ? enabled : false;

    if (finalEnabled && finalProvider === 'openai') {
      // Check if API key is provided or already exists in DB
      const supabaseAdmin = getSupabaseAdmin();
      const { data: existingConfigs, error: checkError } = await supabaseAdmin
        .rpc('get_boltx_configuration', { p_customer_id: user.account_id });

      // If table doesn't exist, skip check and require API key
      const isTableMissing = checkError && (
        checkError.code === '42P01' || 
        (checkError.message && checkError.message.includes('does not exist'))
      );

      if (!isTableMissing) {
        const existingConfig = existingConfigs && existingConfigs.length > 0 ? existingConfigs[0] : null;
        const hasExistingKey = existingConfig?.openai_api_key_encrypted;

        if (!openai_api_key && !hasExistingKey) {
          return apiError('OpenAI API key is required when provider is "openai" and BoltX is enabled', 400);
        }
      } else if (!openai_api_key) {
        // If table doesn't exist and no API key provided, require it
        return apiError('OpenAI API key is required when provider is "openai" and BoltX is enabled', 400);
      }
    }

    // Validate numeric ranges
    if (openai_max_tokens !== undefined) {
      if (typeof openai_max_tokens !== 'number' || openai_max_tokens <= 0 || openai_max_tokens > 100000) {
        return apiError('openai_max_tokens must be between 1 and 100000', 400);
      }
    }

    if (openai_temperature !== undefined) {
      if (typeof openai_temperature !== 'number' || openai_temperature < 0 || openai_temperature > 2) {
        return apiError('openai_temperature must be between 0 and 2', 400);
      }
    }

    if (cache_ttl !== undefined) {
      if (typeof cache_ttl !== 'number' || cache_ttl <= 0) {
        return apiError('cache_ttl must be greater than 0', 400);
      }
    }

    if (rate_limit !== undefined) {
      if (typeof rate_limit !== 'number' || rate_limit <= 0) {
        return apiError('rate_limit must be greater than 0', 400);
      }
    }

    // Encrypt API key if provided
    let encryptedApiKey: string | null = null;
    if (openai_api_key) {
      // Only update if a new key is provided (not empty string)
      if (openai_api_key.trim().length > 0) {
        encryptedApiKey = encryptApiKey(openai_api_key.trim());
      }
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Upsert configuration
    const { data: configId, error: upsertError } = await supabaseAdmin
      .rpc('upsert_boltx_configuration', {
        p_customer_id: user.account_id,
        p_enabled: enabled,
        p_ai_provider: ai_provider,
        p_openai_api_key_encrypted: encryptedApiKey,
        p_openai_model: openai_model,
        p_openai_max_tokens: openai_max_tokens,
        p_openai_temperature: openai_temperature,
        p_cache_enabled: cache_enabled,
        p_cache_ttl: cache_ttl,
        p_rate_limit: rate_limit,
        p_prediction_model_version: prediction_model_version,
        p_metadata: metadata,
      });

    if (upsertError) {
      console.error('❌ [DEBUG] Error upserting BoltX configuration:', upsertError);
      return apiError('Failed to save configuration', 500);
    }

    // Get updated configuration
    const { data: updatedConfigs } = await supabaseAdmin
      .rpc('get_boltx_configuration', { p_customer_id: user.account_id });

    const updatedConfig = updatedConfigs && updatedConfigs.length > 0 ? updatedConfigs[0] : null;

    if (!updatedConfig) {
      return apiError('Failed to retrieve updated configuration', 500);
    }

    // Return masked configuration
    const maskedConfig = {
      ...updatedConfig,
      openai_api_key_masked: updatedConfig.openai_api_key_encrypted
        ? maskApiKey(decryptApiKey(updatedConfig.openai_api_key_encrypted))
        : null,
      openai_api_key_encrypted: undefined,
    };

    return apiSuccess({
      configuration: maskedConfig,
      message: 'Configuration saved successfully',
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in BoltX settings PATCH API:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * Get default configuration from environment variables
 */
function getDefaultConfiguration() {
  return {
    enabled: process.env.BOLTX_ENABLED === 'true',
    ai_provider: (process.env.BOLTX_AI_PROVIDER || 'openai') as 'openai' | 'local',
    openai_api_key_masked: process.env.OPENAI_API_KEY ? maskApiKey(process.env.OPENAI_API_KEY) : null,
    openai_model: process.env.BOLTX_OPENAI_MODEL || 'gpt-4-turbo-preview',
    openai_max_tokens: parseInt(process.env.BOLTX_OPENAI_MAX_TOKENS || '2000', 10),
    openai_temperature: parseFloat(process.env.BOLTX_OPENAI_TEMPERATURE || '0.7'),
    cache_enabled: process.env.BOLTX_CACHE_ENABLED !== 'false',
    cache_ttl: parseInt(process.env.BOLTX_CACHE_TTL || '3600', 10),
    rate_limit: parseInt(process.env.BOLTX_RATE_LIMIT || '60', 10),
    prediction_model_version: process.env.BOLTX_PREDICTION_MODEL_VERSION || 'v1',
    metadata: {},
  };
}

