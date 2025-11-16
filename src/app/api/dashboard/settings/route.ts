import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import { withAuthAndValidation } from '@/lib/api/route-handler';

const settingsSchema = z.object({
  category: z.enum(['general', 'notifications', 'security', 'analytics', 'theme']),
  settings: z.record(z.string(), z.any()),
});

/**
 * GET /api/dashboard/settings
 * Get user settings
 */
export const dynamic = 'force-dynamic';

export const GET = async (_request: NextRequest) => {
  try {
    const { user } = await getAuthenticatedUser();
    const supabaseAdmin = getSupabaseAdmin();

    // Buscar settings usando RPC function (compatível com PostgREST)
    const { data: settings, error: settingsError } = await supabaseAdmin
      .rpc('get_user_settings', { p_user_id: user.id });

    if (settingsError) {
      console.warn('⚠️ [DEBUG] Error fetching user settings, using empty object:', settingsError);
      // Não falha, apenas retorna objeto vazio
    }

    return apiSuccess({
      settings: (settings || {}) as Record<string, any>,
    });
  } catch (error) {
    return apiInternalError(error);
  }
};

/**
 * PATCH /api/dashboard/settings
 * Update user settings
 */
export const PATCH = withAuthAndValidation(
  settingsSchema,
  async (_request: NextRequest, { user: authUser, body }) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Buscar settings atuais usando RPC function
      const { data: currentSettingsData, error: fetchError } = await supabaseAdmin
        .rpc('get_user_settings', { p_user_id: authUser.id });

      if (fetchError) {
        console.error('❌ [DEBUG] Error fetching user settings:', fetchError);
        return apiError('Failed to fetch current settings', 500);
      }

      // Merge new settings with existing
      const currentSettings = (currentSettingsData || {}) as Record<string, any>;
      const updatedSettings = {
        ...currentSettings,
        [body.category]: body.settings,
      };

      // Update settings usando RPC function
      const { data: updatedSettingsData, error: updateError } = await supabaseAdmin
        .rpc('update_user_settings', {
          p_user_id: authUser.id,
          p_settings: updatedSettings as any,
        });

      if (updateError) {
        console.error('❌ [DEBUG] Update settings error:', updateError);
        return apiError('Failed to update settings', 500);
      }

      console.info(`✅ [DEBUG] Settings updated successfully for category: ${body.category}`);
      return apiSuccess({
        settings: (updatedSettingsData || updatedSettings) as Record<string, any>,
      });
    } catch (error) {
      console.error('❌ [DEBUG] Error in PATCH settings:', error);
      return apiInternalError(error);
    }
  }
);

