import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feature-flags
 * Retrieve app feature flags for the current account
 */
export async function GET(_request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get feature flags from database
    const { data: flags, error: flagsError } = await supabaseAdmin
      .rpc('get_app_feature_flags', { p_account_id: user.account_id });

    if (flagsError) {
      // Check if error is due to missing table (relation does not exist)
      const isTableMissing = flagsError.code === '42P01' ||
        (flagsError.message && flagsError.message.includes('does not exist'));

      if (isTableMissing) {
        console.warn('⚠️ [DEBUG] App feature flags table not found. Using default configuration. Please run migration 054.');
      } else {
        console.error('❌ [DEBUG] Error fetching app feature flags:', flagsError);
      }
      // Return defaults based on ENV if no config exists
      return apiSuccess({
        flags: getDefaultFeatureFlags(),
      });
    }

    const flag = flags && flags.length > 0 ? flags[0] : null;

    if (!flag) {
      // Return defaults based on ENV
      return apiSuccess({
        flags: getDefaultFeatureFlags(),
      });
    }

    return apiSuccess({
      flags: {
        event_tracking_enabled: flag.event_tracking_enabled,
        bolt_plugin_enabled: flag.bolt_plugin_enabled,
        console_plugin_enabled: flag.console_plugin_enabled,
        logging_enabled: flag.logging_enabled,
      },
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in feature flags GET API:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * PATCH /api/feature-flags
 * Update app feature flags for the current account
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const body = await request.json();
    const {
      event_tracking_enabled,
      bolt_plugin_enabled,
      console_plugin_enabled,
      logging_enabled,
    } = body;

    // Validation
    if (event_tracking_enabled !== undefined && typeof event_tracking_enabled !== 'boolean') {
      return apiError('event_tracking_enabled must be a boolean', 400);
    }

    if (bolt_plugin_enabled !== undefined && typeof bolt_plugin_enabled !== 'boolean') {
      return apiError('bolt_plugin_enabled must be a boolean', 400);
    }

    if (console_plugin_enabled !== undefined && typeof console_plugin_enabled !== 'boolean') {
      return apiError('console_plugin_enabled must be a boolean', 400);
    }

    if (logging_enabled !== undefined && typeof logging_enabled !== 'boolean') {
      return apiError('logging_enabled must be a boolean', 400);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Upsert feature flags
    const { error: upsertError } = await supabaseAdmin
      .rpc('upsert_app_feature_flags', {
        p_account_id: user.account_id,
        p_event_tracking_enabled: event_tracking_enabled,
        p_bolt_plugin_enabled: bolt_plugin_enabled,
        p_console_plugin_enabled: console_plugin_enabled,
        p_logging_enabled: logging_enabled,
      });

    if (upsertError) {
      console.error('❌ [DEBUG] Error upserting app feature flags:', upsertError);
      return apiError('Failed to save feature flags', 500);
    }

    // Get updated feature flags
    const { data: updatedFlags } = await supabaseAdmin
      .rpc('get_app_feature_flags', { p_account_id: user.account_id });

    const updatedFlag = updatedFlags && updatedFlags.length > 0 ? updatedFlags[0] : null;

    if (!updatedFlag) {
      return apiError('Failed to retrieve updated feature flags', 500);
    }

    return apiSuccess({
      flags: {
        event_tracking_enabled: updatedFlag.event_tracking_enabled,
        bolt_plugin_enabled: updatedFlag.bolt_plugin_enabled,
        console_plugin_enabled: updatedFlag.console_plugin_enabled,
        logging_enabled: updatedFlag.logging_enabled,
      },
      message: 'Feature flags saved successfully',
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in feature flags PATCH API:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * Get default feature flags from environment variables
 */
function getDefaultFeatureFlags() {
  return {
    event_tracking_enabled: process.env.NEXT_PUBLIC_ENABLE_EVENT_TRACKING !== 'false',
    bolt_plugin_enabled: process.env.NEXT_PUBLIC_ENABLE_BOLT_PLUGIN !== 'false',
    console_plugin_enabled: process.env.NEXT_PUBLIC_ENABLE_CONSOLE_PLUGIN === 'true',
    logging_enabled: process.env.NEXT_PUBLIC_ENABLE_LOGGING !== 'false',
  };
}

