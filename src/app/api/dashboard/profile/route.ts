import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';
import { withAuthAndValidation } from '@/lib/api/route-handler';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
});

/**
 * GET /api/dashboard/profile
 * Get user profile data
 */
export const dynamic = 'force-dynamic';

export const GET = async (_request: NextRequest) => {
  try {
    const { user } = await getAuthenticatedUser();

    return apiSuccess({
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        company: user.company || '',
        jobTitle: user.job_title || '',
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login || user.created_at,
      },
    });
  } catch (error) {
    return apiInternalError(error);
  }
};

/**
 * PATCH /api/dashboard/profile
 * Update user profile
 */
export const PATCH = withAuthAndValidation(
  profileSchema,
  async (_request, { user: authUser, body }) => {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // Update user profile
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('dashboard.users')
        .update({
          name: body.name,
          phone: body.phone || null,
          company: body.company || null,
          job_title: body.jobTitle || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update profile error:', updateError);
        return apiError('Failed to update profile', 500);
      }

      return apiSuccess({
        profile: {
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone || '',
          company: updatedUser.company || '',
          jobTitle: updatedUser.job_title || '',
          role: updatedUser.role,
        },
      });
    } catch (error) {
      return apiInternalError(error);
    }
  }
);

