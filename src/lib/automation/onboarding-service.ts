/**
 * Onboarding Service
 * 
 * Handles automatic onboarding process after subscription activation.
 * This service is triggered when a subscription becomes active.
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { generateApiKey, hashApiKey, extractKeyParts } from '@/utils/auth/api-key-generator';

export interface OnboardingStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  completedAt?: string;
}

export interface OnboardingResult {
  success: boolean;
  stepsCompleted: string[];
  errors: string[];
}

/**
 * Trigger onboarding process for an account
 * This is called when a subscription is activated
 */
export async function triggerOnboarding(
  accountId: string,
  subscriptionId: string
): Promise<OnboardingResult> {
  const supabase = getSupabaseAdmin();
  const stepsCompleted: string[] = [];
  const errors: string[] = [];

  console.info(`✅ [DEBUG] Starting onboarding for account ${accountId}`);

  try {
    // Create onboarding status record
    const { error: createError } = await supabase.rpc(
      'create_onboarding_status',
      {
        p_account_id: accountId,
        p_subscription_id: subscriptionId,
      }
    );

    if (createError) {
      console.error('❌ [DEBUG] Error creating onboarding status:', createError);
      // Try to continue anyway
    }

    // Step 1: Generate API Keys
    try {
      await generateMetricsApiKey(accountId);
      stepsCompleted.push('api_keys');
      console.info('✅ [DEBUG] API keys generated');
    } catch (error) {
      const errorMsg = `Failed to generate API keys: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ [DEBUG] ${errorMsg}`);
    }

    // Step 2: Create Default Theme
    try {
      await createDefaultTheme(accountId);
      stepsCompleted.push('default_theme');
      console.info('✅ [DEBUG] Default theme created');
    } catch (error) {
      const errorMsg = `Failed to create default theme: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ [DEBUG] ${errorMsg}`);
    }

    // Step 3: Setup BoltX Config (if enabled)
    try {
      await setupBoltXConfig(accountId);
      stepsCompleted.push('boltx_config');
      console.info('✅ [DEBUG] BoltX config setup');
    } catch (error) {
      const errorMsg = `Failed to setup BoltX: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`❌ [DEBUG] ${errorMsg}`);
    }

    // Step 4: Validate VTEX Integration (async, non-blocking)
    // This runs in background and doesn't block onboarding completion
    validateVTEXIntegration(accountId).catch((error) => {
      console.error('❌ [DEBUG] VTEX validation failed (non-blocking):', error);
    });

    // Update onboarding status
    const { error: updateError } = await supabase.rpc('update_onboarding_status', {
      p_account_id: accountId,
      p_status: errors.length === 0 ? 'completed' : 'failed',
      p_steps_completed: stepsCompleted,
      p_errors: errors,
    });

    if (updateError) {
      console.error('❌ [DEBUG] Error updating onboarding status:', updateError);
    }

    // Update account onboarding_required flag
    await supabase
      .from('customer.accounts')
      .update({ onboarding_required: false })
      .eq('id', accountId);

    console.info(`✅ [DEBUG] Onboarding completed for account ${accountId}. Steps: ${stepsCompleted.length}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      stepsCompleted,
      errors,
    };
  } catch (error) {
    console.error('❌ [DEBUG] Fatal error in onboarding:', error);
    return {
      success: false,
      stepsCompleted,
      errors: [...errors, `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Generate metrics API key for the account
 */
async function generateMetricsApiKey(accountId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Check if metrics key already exists
  const { data: existingKeys, error: checkError } = await supabase.rpc(
    'get_api_keys_by_account',
    { p_account_id: accountId }
  );

  if (checkError) {
    throw new Error(`Failed to check existing keys: ${checkError.message}`);
  }

  // If metrics key exists, skip generation
  const metricsKey = (existingKeys || []).find((key: any) => key.key_type === 'metrics');
  if (metricsKey) {
    console.info('✅ [DEBUG] Metrics API key already exists, skipping generation');
    return;
  }

  // Generate new API key
  const apiKey = generateApiKey(32);
  const keyHash = hashApiKey(apiKey);
  const { prefix, suffix } = extractKeyParts(apiKey);

  // Create metrics API key using upsert (creates if doesn't exist)
  const { error: createError } = await supabase.rpc('upsert_metrics_api_key', {
    p_account_id: accountId,
    p_key_hash: keyHash,
    p_key_prefix: prefix,
    p_key_suffix: suffix,
    p_created_by: null, // System-generated, no user
  });

  if (createError) {
    throw new Error(`Failed to create API key: ${createError.message}`);
  }

  console.info('✅ [DEBUG] Metrics API key generated successfully');
}

/**
 * Create default theme for the account
 */
async function createDefaultTheme(accountId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Check if account already has themes
  const { data: existingThemes, error: checkError } = await supabase.rpc(
    'get_themes_by_account',
    { p_account_id: accountId }
  );

  if (checkError) {
    throw new Error(`Failed to check existing themes: ${checkError.message}`);
  }

  // If themes exist, skip creation
  if (existingThemes && existingThemes.length > 0) {
    console.info('✅ [DEBUG] Themes already exist, skipping default theme creation');
    return;
  }

  // Create default theme
  const { error: createError } = await supabase.rpc('create_theme', {
    p_account_id: accountId,
    p_name: 'Default Theme',
    p_config: {
      baseTheme: 'default',
      visual: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
      },
    },
    p_created_by: null, // System-generated
    p_preview_image_url: null,
    p_is_active: true,
    p_is_default: false,
    p_base_theme: 'default',
    p_is_readonly: false,
  });

  if (createError) {
    throw new Error(`Failed to create default theme: ${createError.message}`);
  }

  console.info('✅ [DEBUG] Default theme created successfully');
}

/**
 * Setup BoltX configuration with defaults
 */
async function setupBoltXConfig(accountId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Check if BoltX config already exists
  const { data: existingConfig, error: checkError } = await supabase
    .from('analytics.boltx_configurations')
    .select('id')
    .eq('customer_id', accountId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine
    throw new Error(`Failed to check BoltX config: ${checkError.message}`);
  }

  // If config exists, skip setup
  if (existingConfig) {
    console.info('✅ [DEBUG] BoltX config already exists, skipping setup');
    return;
  }

  // Create default BoltX config
  const { error: createError } = await supabase
    .from('analytics.boltx_configurations')
    .insert({
      customer_id: accountId,
      enabled: false, // Default to disabled, user can enable later
      ai_provider: 'openai',
      openai_model: 'gpt-4-turbo-preview',
      openai_max_tokens: 2000,
      openai_temperature: 0.7,
      cache_enabled: true,
      cache_ttl: 3600,
      rate_limit: 60,
      prediction_model_version: 'v1',
    });

  if (createError) {
    throw new Error(`Failed to create BoltX config: ${createError.message}`);
  }

  console.info('✅ [DEBUG] BoltX config created successfully');
}

/**
 * Validate VTEX integration (async, non-blocking)
 * This runs in the background and doesn't block onboarding
 */
async function validateVTEXIntegration(accountId: string): Promise<void> {
  // This will be implemented in Phase 6 (VTEX Integration)
  // For now, just log that validation would happen
  console.info(`✅ [DEBUG] VTEX validation queued for account ${accountId} (async)`);
}

