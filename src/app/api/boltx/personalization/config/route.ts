import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';
import { z } from 'zod';

/**
 * Personalization configuration schema
 */
const PersonalizationConfigSchema = z.object({
  enabled: z.boolean(),
  confidenceThreshold: z.number().min(0).max(100).optional(),
  deviceRules: z.record(z.string(), z.object({
    layoutVariant: z.enum(['mobile-first', 'desktop-first']).optional(),
    fieldOrder: z.array(z.string()).optional(),
  })).optional(),
  stepMessages: z.record(z.string(), z.string()).optional(),
  fieldOrderByStep: z.record(z.string(), z.array(z.string())).optional(),
});

/**
 * GET /api/boltx/personalization/config
 * Get current personalization configurations
 */
export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
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

    // Get BoltX configuration
    const { data: configs, error: configError } = await supabaseAdmin
      .rpc('get_boltx_configuration', { p_customer_id: user.account_id });

    if (configError) {
      console.error('❌ [DEBUG] Error fetching BoltX config:', configError);
      // Return default configurations if config not found
      return apiSuccess({
        enabled: true,
        confidenceThreshold: 50,
        deviceRules: {
          mobile: {
            layoutVariant: 'mobile-first',
            fieldOrder: ['email', 'name', 'phone', 'document'],
          },
          desktop: {
            layoutVariant: 'desktop-first',
            fieldOrder: ['email', 'name', 'phone', 'document'],
          },
          tablet: {
            layoutVariant: 'mobile-first',
            fieldOrder: ['email', 'name', 'phone', 'document'],
          },
        },
        stepMessages: {
          profile: 'Welcome! Let\'s get started',
          shipping: 'Choose your shipping method',
          payment: 'Complete your payment',
        },
        fieldOrderByStep: {
          profile: ['email', 'name', 'phone', 'document'],
          shipping: ['address', 'city', 'state', 'zip'],
          payment: ['cardNumber', 'expiry', 'cvv', 'name'],
        },
      });
    }

    const config = configs && configs.length > 0 ? configs[0] : null;

    // Extract personalization config from metadata
    const personalizationConfig = config?.metadata?.personalization || {
      enabled: true,
      confidenceThreshold: 50,
      deviceRules: {
        mobile: {
          layoutVariant: 'mobile-first',
          fieldOrder: ['email', 'name', 'phone', 'document'],
        },
        desktop: {
          layoutVariant: 'desktop-first',
          fieldOrder: ['email', 'name', 'phone', 'document'],
        },
        tablet: {
          layoutVariant: 'mobile-first',
          fieldOrder: ['email', 'name', 'phone', 'document'],
        },
      },
      stepMessages: {
        profile: 'Welcome! Let\'s get started',
        shipping: 'Choose your shipping method',
        payment: 'Complete your payment',
      },
      fieldOrderByStep: {
        profile: ['email', 'name', 'phone', 'document'],
        shipping: ['address', 'city', 'state', 'zip'],
        payment: ['cardNumber', 'expiry', 'cvv', 'name'],
      },
    };

    return apiSuccess(personalizationConfig);
  } catch (error) {
    console.error('❌ [DEBUG] Error in personalization config GET:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * PATCH /api/boltx/personalization/config
 * Update personalization configurations
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

    // Validate request body
    const validationResult = PersonalizationConfigSchema.safeParse(body);
    if (!validationResult.success) {
      return apiValidationError(validationResult.error);
    }

    const personalizationConfig = validationResult.data;

    // Validate confidence threshold
    if (personalizationConfig.confidenceThreshold !== undefined) {
      if (personalizationConfig.confidenceThreshold < 0 || personalizationConfig.confidenceThreshold > 100) {
        return apiError('Confidence threshold must be between 0 and 100', 400);
      }
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get current BoltX configuration
    const { data: configs, error: configError } = await supabaseAdmin
      .rpc('get_boltx_configuration', { p_customer_id: user.account_id });

    if (configError && configError.code !== 'P0001') {
      console.error('❌ [DEBUG] Error fetching BoltX config:', configError);
      return apiError('Failed to fetch configuration', 500);
    }

    const existingConfig = configs && configs.length > 0 ? configs[0] : null;

    // Update metadata with personalization config
    const updatedMetadata = {
      ...(existingConfig?.metadata || {}),
      personalization: personalizationConfig,
      updated_at: new Date().toISOString(),
    };

    // Update or insert configuration using RPC function
    // PostgREST doesn't expose analytics schema directly
    const { error: upsertError } = await supabaseAdmin.rpc(
      'upsert_boltx_configuration',
      {
        p_customer_id: user.account_id,
        p_enabled: existingConfig?.enabled ?? true,
        p_metadata: updatedMetadata,
      }
    );

    if (upsertError) {
      // If RPC function doesn't exist (error codes: 42883, P0001, PGRST202), try direct query as fallback
      if (upsertError.code === '42883' || upsertError.code === 'P0001' || upsertError.code === 'PGRST202') {
        console.warn('⚠️ [DEBUG] RPC function not found in PostgREST schema cache. Attempting direct query fallback...');

        if (existingConfig) {
          const { error: updateError } = await supabaseAdmin
            .from('analytics.boltx_configurations')
            .update({
              metadata: updatedMetadata,
              updated_at: new Date().toISOString(),
            })
            .eq('customer_id', user.account_id);

          if (updateError) {
            console.error('❌ [DEBUG] Error updating BoltX config:', updateError);
            return apiError('Failed to update configuration. Please run migration 042 to expose the table via RPC functions.', 500);
          }
        } else {
          const { error: insertError } = await supabaseAdmin
            .from('analytics.boltx_configurations')
            .insert({
              customer_id: user.account_id,
              enabled: true,
              metadata: updatedMetadata,
            });

          if (insertError) {
            console.error('❌ [DEBUG] Error creating BoltX config:', insertError);
            return apiError('Failed to create configuration. Please run migration 042 to expose the table via RPC functions.', 500);
          }
        }
      } else {
        console.error('❌ [DEBUG] Error upserting BoltX config:', upsertError);
        return apiError('Failed to update configuration', 500);
      }
    }

    console.info('✅ [DEBUG] Personalization configurations updated:', {
      customerId: user.account_id,
      enabled: personalizationConfig.enabled,
    });

    return apiSuccess(personalizationConfig);
  } catch (error) {
    console.error('❌ [DEBUG] Error in personalization config PATCH:', error);
    return apiError('Internal server error', 500);
  }
}

