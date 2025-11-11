import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';
import { PersonalizationConfig, UserProfile } from '@/lib/ai/types';
import { getUserPlan } from '@/lib/api/plan-check';

/**
 * GET /api/boltx/personalize?sessionId=...
 * Get personalization configuration for a checkout session
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    console.info('[⚡️BoltX Personalize] CORS Debug:', {
      origin,
      corsHeaders,
      allowedOrigins: getAllowedOrigins(),
    });
  }

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

    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      const response = apiError('User account not found', 404);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const step = searchParams.get('step');

    if (!sessionId) {
      const response = apiError('Session ID is required', 400);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get or create user profile
    const profile = await getUserProfile(supabaseAdmin, user.account_id, sessionId);

    // Generate personalization config based on profile
    const config = generatePersonalizationConfig(profile, step || undefined);

    const response = apiSuccess(config);
    // Add CORS headers to success response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('❌ [DEBUG] Error in personalize API:', error);
    const response = apiError('Internal server error', 500);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

/**
 * POST /api/boltx/personalize
 * Update user profile for personalization
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.info('[⚡️BoltX Personalize] CORS Debug:', {
      origin,
      corsHeaders,
      allowedOrigins: getAllowedOrigins(),
    });
  }

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

    const { user } = await getAuthenticatedUser();

    if (!user.account_id) {
      const response = apiError('User account not found', 404);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const body = await request.json();
    const { sessionId, deviceType, browser, location, behavior, preferences } = body;

    if (!sessionId) {
      const response = apiError('Session ID is required', 400);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Update user profile
    await supabaseAdmin.rpc('update_user_profile', {
      p_session_id: sessionId,
      p_customer_id: user.account_id,
      p_device_type: deviceType,
      p_browser: browser,
      p_location: location || null,
      p_behavior: behavior || null,
      p_preferences: preferences || null,
      p_inferred_intent: null, // Will be calculated
    });

    const response = apiSuccess({ success: true });
    // Add CORS headers to success response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error('❌ [DEBUG] Error updating profile:', error);
    const response = apiError('Internal server error', 500);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

/**
 * Get or create user profile
 */
async function getUserProfile(
  supabase: any,
  customerId: string,
  sessionId: string
): Promise<UserProfile> {
  try {
    // Try to get existing profile
    // Use direct query since RPC might not exist yet
    let profiles: any = null;
    try {
      const result = await supabase
        .rpc('get_user_profile_by_session', {
          p_session_id: sessionId,
          p_customer_id: customerId,
        });
      profiles = result.data;
    } catch {
      // RPC doesn't exist, query directly if possible
      // For now, return default profile
    }

    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      return {
        sessionId,
        deviceType: profile.device_type || 'desktop',
        browser: profile.browser || 'unknown',
        location: profile.location || undefined,
        behavior: profile.behavior || {},
        preferences: profile.preferences || {},
        inferredIntent: profile.inferred_intent || undefined,
      };
    }

    // Return default profile if not found
    return {
      sessionId,
      deviceType: 'desktop',
      browser: 'unknown',
      behavior: {
        timeOnSite: 0,
        pagesVisited: 0,
        checkoutAttempts: 0,
      },
      preferences: {},
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error getting user profile:', error);
    // Return default profile on error
    return {
      sessionId,
      deviceType: 'desktop',
      browser: 'unknown',
      behavior: {
        timeOnSite: 0,
        pagesVisited: 0,
        checkoutAttempts: 0,
      },
      preferences: {},
    };
  }
}

/**
 * Generate personalization config based on user profile
 */
function generatePersonalizationConfig(
  profile: UserProfile,
  step?: string
): PersonalizationConfig {
  const config: PersonalizationConfig = {
    fieldOrder: [],
    highlightedOptions: {},
    messages: {},
    showRecommendations: true,
  };

  // Device-based personalization
  if (profile.deviceType === 'mobile') {
    config.layoutVariant = 'mobile-first';
    config.messages.welcome = 'Complete your purchase quickly on mobile';
  } else {
    config.layoutVariant = 'desktop-first';
  }

  // Step-specific personalizations
  if (step === 'payment') {
    // Highlight preferred payment method if available
    if (profile.preferences?.preferredPaymentMethod) {
      config.highlightedOptions.paymentMethods = [
        profile.preferences.preferredPaymentMethod,
      ];
    } else {
      // Default to credit card as most common
      config.highlightedOptions.paymentMethods = ['creditCard'];
    }
  }

  if (step === 'shipping') {
    // Highlight preferred shipping method if available
    if (profile.preferences?.preferredShippingMethod) {
      config.highlightedOptions.shippingOptions = [
        profile.preferences.preferredShippingMethod,
      ];
    }
  }

  // Behavior-based field ordering
  // For now, use default order but can be customized based on behavior patterns
  if (step === 'profile') {
    config.fieldOrder = ['email', 'name', 'phone', 'document'];
  }

  // Urgency-based messages
  if (profile.inferredIntent?.urgency === 'high') {
    config.messages.urgency = 'Limited time offer - complete checkout now!';
  }

  return config;
}

