import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/boltx/status
 * Public endpoint to check if BoltX is enabled for a VTEX account
 * 
 * This endpoint is called by the checkout to verify BoltX status.
 * It checks the database first, then falls back to environment variables.
 * Priority: Database > Environment Variables
 * 
 * @param vtexAccount - VTEX account name (query parameter)
 * @param X-API-Key - API key for authentication (header)
 */

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

  // Use origin if allowed, otherwise use first allowed origin or '*'
  // In development with no config, allow any origin
  let corsOrigin: string;
  if (isAllowed && origin) {
    corsOrigin = origin;
  } else if (allowedOrigins.length > 0) {
    corsOrigin = allowedOrigins[0];
  } else if (process.env.NODE_ENV === 'development') {
    // In development, be permissive if no origins configured
    corsOrigin = origin || '*';
  } else {
    corsOrigin = '*';
  }

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
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

/**
 * Get BoltX enabled status from environment variables
 */
function getBoltXStatusFromEnv(): {
  enabled: boolean;
  interventions_enabled: boolean;
  personalization_enabled: boolean;
  optimizations_enabled: boolean;
  source: 'env';
} {
  const enabled = process.env.BOLTX_ENABLED === 'true';
  return {
    enabled,
    interventions_enabled: process.env.NEXT_PUBLIC_BOLTX_INTERVENTIONS !== 'false',
    personalization_enabled: process.env.NEXT_PUBLIC_BOLTX_PERSONALIZATION !== 'false',
    optimizations_enabled: process.env.NEXT_PUBLIC_BOLTX_OPTIMIZATIONS !== 'false',
    source: 'env',
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.info('[⚡️BoltX] CORS Debug:', {
      origin,
      corsHeaders,
      allowedOrigins: getAllowedOrigins(),
    });
  }

  try {
    // Validate API Key
    const apiKey = request.headers.get('X-API-Key');
    const expectedApiKey = process.env.METRICS_API_KEY;

    if (!expectedApiKey) {
      console.warn('[⚡️BoltX] METRICS_API_KEY not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (apiKey !== expectedApiKey) {
      console.warn('[⚡️BoltX] Invalid API key');
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get VTEX account name from query parameter
    const { searchParams } = new URL(request.url);
    const vtexAccount = searchParams.get('vtexAccount');

    if (!vtexAccount) {
      console.warn('[⚡️BoltX] VTEX account name not provided');
      // Fallback to ENV if no account provided
      return NextResponse.json(getBoltXStatusFromEnv(), { headers: corsHeaders });
    }

    console.info('[⚡️BoltX] Checking status from database for VTEX account:', vtexAccount);

    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Find account by VTEX account name using RPC function
      const { data: accounts, error: accountError } = await supabaseAdmin
        .rpc('get_account_by_vtex_name', { p_vtex_account_name: vtexAccount });

      if (accountError) {
        console.warn('[⚡️BoltX] Error fetching account from DB, falling back to ENV:', accountError);
        return NextResponse.json(getBoltXStatusFromEnv(), { headers: corsHeaders });
      }

      if (!accounts || accounts.length === 0) {
        console.warn('[⚡️BoltX] Account not found in DB, falling back to ENV');
        return NextResponse.json(getBoltXStatusFromEnv(), { headers: corsHeaders });
      }

      const accountId = accounts[0].id;
      console.info('[⚡️BoltX] Account found, checking BoltX configuration for account_id:', accountId);

      // Get BoltX configuration for this account
      const { data: configs, error: configError } = await supabaseAdmin
        .rpc('get_boltx_configuration', { p_customer_id: accountId });

      if (configError) {
        // Check if error is due to missing table/function
        const isTableMissing = configError.code === '42P01' ||
          (configError.message && configError.message.includes('does not exist'));

        if (isTableMissing) {
          console.warn('[⚡️BoltX] BoltX configuration table/function not found. Using ENV configuration. Please run migrations.');
        } else {
          console.warn('[⚡️BoltX] Error loading BoltX config from DB, using ENV:', configError);
        }
        return NextResponse.json(getBoltXStatusFromEnv(), { headers: corsHeaders });
      }

      const config = configs && configs.length > 0 ? configs[0] : null;

      if (!config) {
        console.info('[⚡️BoltX] No configuration found in DB, falling back to ENV');
        return NextResponse.json(getBoltXStatusFromEnv(), { headers: corsHeaders });
      }

      // Return status from database
      const enabled = config.enabled === true;
      const interventionsEnabled = config.interventions_enabled !== false;
      const personalizationEnabled = config.personalization_enabled !== false;
      const optimizationsEnabled = config.optimizations_enabled !== false;
      
      console.info('[⚡️BoltX] Status from database:', {
        enabled,
        interventions_enabled: interventionsEnabled,
        personalization_enabled: personalizationEnabled,
        optimizations_enabled: optimizationsEnabled,
        accountId,
      });

      return NextResponse.json(
        {
          enabled,
          interventions_enabled: interventionsEnabled,
          personalization_enabled: personalizationEnabled,
          optimizations_enabled: optimizationsEnabled,
          source: 'database',
        },
        { headers: corsHeaders }
      );
    } catch (error) {
      console.error('[⚡️BoltX] Error checking database, falling back to ENV:', error);
      return NextResponse.json(getBoltXStatusFromEnv(), { headers: corsHeaders });
    }
  } catch (error) {
    console.error('[⚡️BoltX] Error in BoltX status API:', error);
    // Fallback to ENV on any error
    return NextResponse.json(getBoltXStatusFromEnv(), { headers: corsHeaders });
  }
}

