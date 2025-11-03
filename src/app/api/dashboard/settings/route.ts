import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import { withAuthAndValidation } from '@/lib/api/route-handler';

const settingsSchema = z.object({
  category: z.enum(['general', 'notifications', 'security', 'analytics']),
  settings: z.record(z.string(), z.any()),
});

/**
 * GET /api/dashboard/settings
 * Get user settings
 */
export const GET = async (_request: NextRequest) => {
  try {
    const { user } = await getAuthenticatedUser();

    return apiSuccess({
      settings: user.settings || {},
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

      // Get current settings using RPC function (required for custom schema)
      const { data: users, error: userError } = await supabaseAdmin
        .rpc('get_user_by_id', { p_user_id: authUser.id });

      const user = users && users.length > 0 ? users[0] : null;

      if (userError || !user) {
        return apiError('User not found', 404);
      }

      // Merge new settings with existing
      const currentSettings = (user.settings || {}) as Record<string, string>;
      const updatedSettings = {
        ...currentSettings,
        [body.category]: body.settings,
      };

      // Update settings
      const { error: updateError } = await supabaseAdmin
        .from('dashboard.users')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('Update settings error:', updateError);
        return apiError('Failed to update settings', 500);
      }

      return apiSuccess({
        settings: updatedSettings,
      });
    } catch (error) {
      return apiInternalError(error);
    }
  }
);

