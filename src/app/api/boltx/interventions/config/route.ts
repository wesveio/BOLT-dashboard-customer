import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';
import { z } from 'zod';

/**
 * Intervention configuration schema
 */
const InterventionConfigSchema = z.object({
  type: z.enum(['discount', 'security', 'simplify', 'progress']),
  enabled: z.boolean(),
  threshold: z.number().min(0).max(100),
  message: z.string().optional(),
  discount: z.object({
    percentage: z.number().min(0).max(100).optional(),
    amount: z.number().min(0).optional(),
    code: z.string().optional(),
  }).optional(),
});

const InterventionsConfigSchema = z.object({
  interventions: z.array(InterventionConfigSchema),
});

/**
 * GET /api/boltx/interventions/config
 * Get current intervention configurations
 */
export const dynamic = 'force-dynamic';

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

    // Get BoltX configuration
    const { data: configs, error: configError } = await supabaseAdmin
      .rpc('get_boltx_configuration', { p_customer_id: user.account_id });

    if (configError) {
      console.error('❌ [DEBUG] Error fetching BoltX config:', configError);
      // Return default configurations if config not found
      return apiSuccess({
        interventions: [
          {
            type: 'discount',
            enabled: true,
            threshold: 70,
            message: 'Special offer: Get 10% off your order!',
            discount: { percentage: 10 },
          },
          {
            type: 'security',
            enabled: true,
            threshold: 50,
            message: 'Your payment is secure and encrypted',
          },
          {
            type: 'simplify',
            enabled: true,
            threshold: 40,
            message: 'Need help? Contact our support team',
          },
          {
            type: 'progress',
            enabled: true,
            threshold: 30,
            message: "You're almost done! Complete your purchase",
          },
        ],
      });
    }

    const config = configs && configs.length > 0 ? configs[0] : null;

    // Extract interventions from metadata
    const interventions = config?.metadata?.interventions || [
      {
        type: 'discount',
        enabled: true,
        threshold: 70,
        message: 'Special offer: Get 10% off your order!',
        discount: { percentage: 10 },
      },
      {
        type: 'security',
        enabled: true,
        threshold: 50,
        message: 'Your payment is secure and encrypted',
      },
      {
        type: 'simplify',
        enabled: true,
        threshold: 40,
        message: 'Need help? Contact our support team',
      },
      {
        type: 'progress',
        enabled: true,
        threshold: 30,
        message: "You're almost done! Complete your purchase",
      },
    ];

    return apiSuccess({ interventions });
  } catch (error) {
    console.error('❌ [DEBUG] Error in interventions config GET:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * PATCH /api/boltx/interventions/config
 * Update intervention configurations
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
    const validationResult = InterventionsConfigSchema.safeParse(body);
    if (!validationResult.success) {
      return apiValidationError(validationResult.error);
    }

    const { interventions } = validationResult.data;

    // Validate each intervention
    for (const intervention of interventions) {
      if (intervention.type === 'discount' && intervention.discount) {
        if (intervention.discount.percentage && intervention.discount.percentage > 100) {
          return apiError('Discount percentage cannot exceed 100%', 400);
        }
        if (intervention.discount.amount && intervention.discount.amount < 0) {
          return apiError('Discount amount cannot be negative', 400);
        }
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

    // Update metadata with interventions
    const updatedMetadata = {
      ...(existingConfig?.metadata || {}),
      interventions,
      updated_at: new Date().toISOString(),
    };

    // Update or insert configuration using RPC function
    // PostgREST doesn't expose analytics schema directly
    const { data: configId, error: upsertError } = await supabaseAdmin.rpc(
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

    console.info('✅ [DEBUG] Intervention configurations updated:', {
      customerId: user.account_id,
      interventionsCount: interventions.length,
    });

    return apiSuccess({ interventions });
  } catch (error) {
    console.error('❌ [DEBUG] Error in interventions config PATCH:', error);
    return apiError('Internal server error', 500);
  }
}

