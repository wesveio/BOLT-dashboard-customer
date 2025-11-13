import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/responses';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BuyerUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['buyer', 'approver', 'admin']).optional(),
  costCenter: z.string().optional(),
  department: z.string().optional(),
  projectCode: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
});

/**
 * PATCH /api/dashboard/b2b/buyers/[id]
 * Update a buyer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = BuyerUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return apiValidationError(validationResult.error);
    }

    // TODO: In production, update in database
    const updatedBuyer = {
      id,
      account_id: user.account_id,
      ...validationResult.data,
      updated_at: new Date().toISOString(),
    };

    return apiSuccess({ buyer: updatedBuyer });
  } catch (error) {
    console.error('❌ [DEBUG] Error updating buyer:', error);
    return apiError('Failed to update buyer', 500);
  }
}

/**
 * DELETE /api/dashboard/b2b/buyers/[id]
 * Delete a buyer
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    await params; // Extract params for route validation

    // TODO: In production, delete from database
    return apiSuccess({ message: 'Buyer deleted successfully' });
  } catch (error) {
    console.error('❌ [DEBUG] Error deleting buyer:', error);
    return apiError('Failed to delete buyer', 500);
  }
}

