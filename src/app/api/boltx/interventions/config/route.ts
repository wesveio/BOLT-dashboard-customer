import { NextRequest, NextResponse } from 'next/server';
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

/**
 * Get allowed origins for CORS
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];

  // In development, always allow localhost on any port
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost', 'http://127.0.0.1', ...envOrigins];
  }

  // In production, require explicit configuration
  return envOrigins.length > 0 ? envOrigins : [];
}

/**
 * Get CORS headers
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();

  // Check if origin is allowed (supports wildcards like localhost:*)
  const isAllowed = origin && (
    allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (origin === allowed) return true;
      // Support localhost:* pattern - match any localhost with any port
      if ((allowed.includes('localhost') || allowed.includes('127.0.0.1')) && 
          (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return true;
      }
      return false;
    })
  );

  // Use origin if allowed, otherwise use first allowed origin
  // When using credentials, we cannot use '*' - must use specific origin
  let corsOrigin: string;
  if (isAllowed && origin) {
    corsOrigin = origin;
  } else if (allowedOrigins.length > 0) {
    corsOrigin = allowedOrigins[0];
  } else if (process.env.NODE_ENV === 'development') {
    // In development, use the request origin if available, otherwise allow localhost
    // Cannot use '*' when credentials are included
    corsOrigin = origin || 'http://localhost:3000';
  } else {
    // In production, require explicit configuration
    // Default to first allowed origin or request origin
    corsOrigin = allowedOrigins[0] || origin || 'http://localhost:3000';
  }

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle OPTIONS request (preflight)
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.info('[⚡️BoltX Interventions Config] CORS Debug:', {
      origin,
      corsHeaders,
      allowedOrigins: getAllowedOrigins(),
    });
  }

  try {
    // Support both API key (for cross-origin requests) and cookie-based auth
    const apiKey = request.headers.get('X-API-Key');
    const expectedApiKey = process.env.METRICS_API_KEY;
    
    let accountId: string | null = null;

    // Try API key authentication first (for cross-origin requests from checkout)
    if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
      console.info('[⚡️BoltX Interventions Config] Authenticated via API key');
      
      // For API key auth, get account_id from query parameter
      const { searchParams } = new URL(request.url);
      const vtexAccount = searchParams.get('vtexAccount');
      
      if (vtexAccount) {
        const supabaseAdmin = getSupabaseAdmin();
        // Use RPC function to query customer.accounts (PostgREST doesn't expose customer schema directly)
        const { data: accounts, error: accountError } = await supabaseAdmin
          .rpc('get_account_by_vtex_name', { p_vtex_account_name: vtexAccount });
        
        if (accountError) {
          console.error('❌ [DEBUG] Error fetching account by vtex_account_name:', accountError);
        } else if (accounts && accounts.length > 0) {
          accountId = accounts[0].id;
          console.info('✅ [DEBUG] Found account_id for vtex_account_name:', vtexAccount, 'account_id:', accountId);
        } else {
          console.warn('⚠️ [DEBUG] No account found for vtex_account_name:', vtexAccount);
        }
      }
      
      // If no account found, return default configs (public endpoint behavior)
      if (!accountId) {
        const defaultConfigs = {
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
        };
        const response = apiSuccess(defaultConfigs);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
    } else {
      // Fall back to cookie-based authentication
      try {
        // Check Enterprise plan access
        const { hasEnterpriseAccess, error: planError } = await getUserPlan();
        if (!hasEnterpriseAccess) {
          const response = apiError(
            planError || 'BoltX is only available on Enterprise plan. Please upgrade to access this feature.',
            403
          );
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }

        const authResult = await getAuthenticatedUser();
        accountId = authResult.user.account_id ?? null;

        if (!accountId) {
          const response = apiError('User account not found', 404);
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }
      } catch (authError) {
        // If cookie auth fails and no API key provided, return 401
        if (!apiKey) {
          const response = apiError('Authentication required. Provide X-API-Key header or valid session cookie.', 401);
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          return response;
        }
        // If API key was provided but invalid, return 401
        const response = apiError('Invalid API key', 401);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      }
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get BoltX configuration
    const { data: configs, error: configError } = await supabaseAdmin
      .rpc('get_boltx_configuration', { p_customer_id: accountId });

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

    const response = apiSuccess({ interventions });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('❌ [DEBUG] Error in interventions config GET:', error);
    const response = apiError('Internal server error', 500);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

/**
 * PATCH /api/boltx/interventions/config
 * Update intervention configurations
 */
export async function PATCH(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    // PATCH requires cookie-based authentication (admin operation)
    // Check Enterprise plan access
    const { hasEnterpriseAccess, error: planError } = await getUserPlan();
    if (!hasEnterpriseAccess) {
      const response = apiError(
        planError || 'BoltX is only available on Enterprise plan. Please upgrade to access this feature.',
        403
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      const response = apiError('User account not found', 404);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
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

    console.info('✅ [DEBUG] Intervention configurations updated:', {
      customerId: user.account_id,
      interventionsCount: interventions.length,
    });

    const response = apiSuccess({ interventions });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('❌ [DEBUG] Error in interventions config PATCH:', error);
    const response = apiError('Internal server error', 500);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

