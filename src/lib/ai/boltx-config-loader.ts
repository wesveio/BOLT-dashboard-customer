/**
 * BoltX Configuration Loader
 * 
 * Loads BoltX configuration from database with fallback to environment variables.
 * Database configuration takes precedence over ENV variables.
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { AIServiceConfig, AIProvider } from './types';

export interface BoltXConfiguration {
  enabled: boolean;
  ai_provider: AIProvider;
  openai?: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
  rateLimit: {
    requestsPerMinute: number;
  };
  predictionModelVersion: string;
}

/**
 * Decrypt API key (simple base64 for now)
 * TODO: Implement proper decryption in production
 */
function decryptApiKey(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

/**
 * Load BoltX configuration from database for a customer account
 * Falls back to environment variables if not found in database
 */
export async function loadBoltXConfiguration(
  customerId: string
): Promise<BoltXConfiguration | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Try to get configuration from database
    // Note: Function is in public schema, not analytics
    const { data: configs, error } = await supabaseAdmin
      .rpc('get_boltx_configuration', { p_customer_id: customerId });

    if (error) {
      // Check if error is due to missing table (relation does not exist)
      const isTableMissing = error.code === '42P01' || 
        (error.message && error.message.includes('does not exist'));
      
      if (isTableMissing) {
        console.warn('⚠️ [DEBUG] BoltX configuration table not found. Using ENV configuration. Please run migrations 041 and 042.');
      } else {
        console.warn('⚠️ [DEBUG] Error loading BoltX config from DB, using ENV:', error);
      }
      return getEnvConfiguration();
    }

    const config = configs && configs.length > 0 ? configs[0] : null;

    if (!config || !config.enabled) {
      // If not enabled or not found, return null (BoltX disabled)
      // But still check ENV as fallback
      return getEnvConfiguration();
    }

    // Build configuration from database
    const dbConfig: BoltXConfiguration = {
      enabled: config.enabled,
      ai_provider: (config.ai_provider || 'openai') as AIProvider,
      cache: {
        enabled: config.cache_enabled ?? true,
        ttl: config.cache_ttl ?? 3600,
      },
      rateLimit: {
        requestsPerMinute: config.rate_limit ?? 60,
      },
      predictionModelVersion: config.prediction_model_version || 'v1',
    };

    // Add OpenAI config if provider is openai
    if (dbConfig.ai_provider === 'openai' && config.openai_api_key_encrypted) {
      const apiKey = decryptApiKey(config.openai_api_key_encrypted);
      dbConfig.openai = {
        apiKey,
        model: config.openai_model || 'gpt-4-turbo-preview',
        maxTokens: config.openai_max_tokens ?? 2000,
        temperature: parseFloat(String(config.openai_temperature ?? 0.7)),
      };
    } else if (dbConfig.ai_provider === 'openai') {
      // If provider is openai but no key in DB, try ENV
      const envConfig = getEnvConfiguration();
      if (envConfig?.openai?.apiKey) {
        dbConfig.openai = envConfig.openai;
      }
    }

    return dbConfig;
  } catch (error) {
    console.error('❌ [DEBUG] Error loading BoltX configuration:', error);
    // Fallback to ENV on error
    return getEnvConfiguration();
  }
}

/**
 * Get configuration from environment variables
 */
function getEnvConfiguration(): BoltXConfiguration | null {
  const enabled = process.env.BOLTX_ENABLED === 'true';
  
  if (!enabled) {
    return null;
  }

  const provider = (process.env.BOLTX_AI_PROVIDER || 'openai') as AIProvider;
  const openaiKey = process.env.OPENAI_API_KEY;

  const config: BoltXConfiguration = {
    enabled: true,
    ai_provider: provider,
    cache: {
      enabled: process.env.BOLTX_CACHE_ENABLED !== 'false',
      ttl: parseInt(process.env.BOLTX_CACHE_TTL || '3600', 10),
    },
    rateLimit: {
      requestsPerMinute: parseInt(process.env.BOLTX_RATE_LIMIT || '60', 10),
    },
    predictionModelVersion: process.env.BOLTX_PREDICTION_MODEL_VERSION || 'v1',
  };

  if (provider === 'openai' && openaiKey) {
    config.openai = {
      apiKey: openaiKey,
      model: process.env.BOLTX_OPENAI_MODEL || 'gpt-4-turbo-preview',
      maxTokens: parseInt(process.env.BOLTX_OPENAI_MAX_TOKENS || '2000', 10),
      temperature: parseFloat(process.env.BOLTX_OPENAI_TEMPERATURE || '0.7'),
    };
  }

  return config;
}

/**
 * Convert BoltXConfiguration to AIServiceConfig
 */
export function toAIServiceConfig(config: BoltXConfiguration): AIServiceConfig {
  return {
    provider: config.ai_provider,
    openai: config.openai,
    cache: config.cache,
    rateLimit: config.rateLimit,
  };
}

