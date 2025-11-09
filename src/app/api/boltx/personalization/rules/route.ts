import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/responses';
import { getUserPlan } from '@/lib/api/plan-check';
import { z } from 'zod';

/**
 * Personalization rule schema
 */
const PersonalizationRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(['device', 'location', 'behavior', 'preferences']),
  condition: z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'greaterThan', 'lessThan', 'in']),
    value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
  }),
  action: z.object({
    layoutVariant: z.enum(['mobile-first', 'desktop-first']).optional(),
    fieldOrder: z.array(z.string()).optional(),
    highlightedOptions: z.object({
      paymentMethods: z.array(z.string()).optional(),
      shippingOptions: z.array(z.string()).optional(),
    }).optional(),
    messages: z.record(z.string(), z.string()).optional(),
  }),
  enabled: z.boolean(),
  priority: z.number().min(0).max(100).optional(),
});

const PersonalizationRulesSchema = z.object({
  rules: z.array(PersonalizationRuleSchema),
});

/**
 * GET /api/boltx/personalization/rules
 * Get all personalization rules
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
      // Return empty rules array if config not found
      return apiSuccess({ rules: [] });
    }

    const config = configs && configs.length > 0 ? configs[0] : null;

    // Extract rules from metadata
    const rules = config?.metadata?.personalizationRules || [];

    return apiSuccess({ rules });
  } catch (error) {
    console.error('❌ [DEBUG] Error in personalization rules GET:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * POST /api/boltx/personalization/rules
 * Create a new personalization rule
 */
export async function POST(request: NextRequest) {
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
    const validationResult = PersonalizationRuleSchema.safeParse(body);
    if (!validationResult.success) {
      return apiValidationError(validationResult.error);
    }

    const newRule = validationResult.data;

    // Generate ID if not provided
    if (!newRule.id) {
      newRule.id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    const existingRules = existingConfig?.metadata?.personalizationRules || [];

    // Check if rule with same ID already exists
    if (existingRules.some((r: any) => r.id === newRule.id)) {
      return apiError('Rule with this ID already exists', 400);
    }

    // Add new rule
    const updatedRules = [...existingRules, newRule];

    // Update metadata with rules
    const updatedMetadata = {
      ...(existingConfig?.metadata || {}),
      personalizationRules: updatedRules,
      updated_at: new Date().toISOString(),
    };

    // Update or insert configuration
    if (existingConfig) {
      const { error: updateError } = await supabaseAdmin
        .from('boltx_configurations')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', user.account_id);

      if (updateError) {
        console.error('❌ [DEBUG] Error updating BoltX config:', updateError);
        return apiError('Failed to update configuration', 500);
      }
    } else {
      // Create new configuration
      const { error: insertError } = await supabaseAdmin
        .from('boltx_configurations')
        .insert({
          customer_id: user.account_id,
          enabled: true,
          metadata: updatedMetadata,
        });

      if (insertError) {
        console.error('❌ [DEBUG] Error creating BoltX config:', insertError);
        return apiError('Failed to create configuration', 500);
      }
    }

    console.info('✅ [DEBUG] Personalization rule created:', {
      customerId: user.account_id,
      ruleId: newRule.id,
      ruleName: newRule.name,
    });

    return apiSuccess({ rule: newRule });
  } catch (error) {
    console.error('❌ [DEBUG] Error in personalization rules POST:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * PATCH /api/boltx/personalization/rules
 * Update personalization rules (replace all or update specific rule)
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
    const validationResult = PersonalizationRulesSchema.safeParse(body);
    if (!validationResult.success) {
      return apiValidationError(validationResult.error);
    }

    const { rules } = validationResult.data;

    const supabaseAdmin = getSupabaseAdmin();

    // Get current BoltX configuration
    const { data: configs, error: configError } = await supabaseAdmin
      .rpc('get_boltx_configuration', { p_customer_id: user.account_id });

    if (configError && configError.code !== 'P0001') {
      console.error('❌ [DEBUG] Error fetching BoltX config:', configError);
      return apiError('Failed to fetch configuration', 500);
    }

    const existingConfig = configs && configs.length > 0 ? configs[0] : null;

    // Update metadata with rules
    const updatedMetadata = {
      ...(existingConfig?.metadata || {}),
      personalizationRules: rules,
      updated_at: new Date().toISOString(),
    };

    // Update or insert configuration
    if (existingConfig) {
      const { error: updateError } = await supabaseAdmin
        .from('boltx_configurations')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', user.account_id);

      if (updateError) {
        console.error('❌ [DEBUG] Error updating BoltX config:', updateError);
        return apiError('Failed to update configuration', 500);
      }
    } else {
      // Create new configuration
      const { error: insertError } = await supabaseAdmin
        .from('boltx_configurations')
        .insert({
          customer_id: user.account_id,
          enabled: true,
          metadata: updatedMetadata,
        });

      if (insertError) {
        console.error('❌ [DEBUG] Error creating BoltX config:', insertError);
        return apiError('Failed to create configuration', 500);
      }
    }

    console.info('✅ [DEBUG] Personalization rules updated:', {
      customerId: user.account_id,
      rulesCount: rules.length,
    });

    return apiSuccess({ rules });
  } catch (error) {
    console.error('❌ [DEBUG] Error in personalization rules PATCH:', error);
    return apiError('Internal server error', 500);
  }
}

