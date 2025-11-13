import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/responses';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ApprovalWorkflowUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional().nullable(),
  approvers: z.array(z.string()).optional(),
  requiredApprovals: z.number().min(1).max(10).optional(),
  autoApprove: z.boolean().optional(),
  conditions: z.object({
    costCenter: z.array(z.string()).optional(),
    department: z.array(z.string()).optional(),
    projectCode: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * GET /api/dashboard/b2b/workflows/[id]
 * Get a specific workflow
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const { id } = await params;

    // TODO: In production, fetch from database
    const workflow = {
      id,
      account_id: user.account_id,
      name: 'Standard Approval',
      enabled: true,
      minAmount: 1000,
      maxAmount: 10000,
      approvers: ['approver_1', 'approver_2'],
      requiredApprovals: 1,
      autoApprove: false,
      conditions: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return apiSuccess({ workflow });
  } catch (error) {
    console.error('❌ [DEBUG] Error fetching workflow:', error);
    return apiError('Failed to fetch workflow', 500);
  }
}

/**
 * PATCH /api/dashboard/b2b/workflows/[id]
 * Update a workflow
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
    const validationResult = ApprovalWorkflowUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return apiValidationError(validationResult.error);
    }

    // TODO: In production, update in database
    const updatedWorkflow = {
      id,
      account_id: user.account_id,
      ...validationResult.data,
      updated_at: new Date().toISOString(),
    };

    return apiSuccess({ workflow: updatedWorkflow });
  } catch (error) {
    console.error('❌ [DEBUG] Error updating workflow:', error);
    return apiError('Failed to update workflow', 500);
  }
}

/**
 * DELETE /api/dashboard/b2b/workflows/[id]
 * Delete a workflow
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
    return apiSuccess({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('❌ [DEBUG] Error deleting workflow:', error);
    return apiError('Failed to delete workflow', 500);
  }
}

