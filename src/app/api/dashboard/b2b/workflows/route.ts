import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/responses';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Approval Workflow Schema
 */
const ApprovalWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  enabled: z.boolean(),
  minAmount: z.number().min(0),
  maxAmount: z.number().min(0).optional(),
  approvers: z.array(z.string()).min(1, 'At least one approver is required'),
  requiredApprovals: z.number().min(1).max(10),
  autoApprove: z.boolean().optional(),
  conditions: z.object({
    costCenter: z.array(z.string()).optional(),
    department: z.array(z.string()).optional(),
    projectCode: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * GET /api/dashboard/b2b/workflows
 * Get all approval workflows for the account
 */
export async function GET(_request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    // TODO: In production, fetch from database
    // const supabaseAdmin = getSupabaseAdmin();
    // For now, return mock data
    const workflows = [
      {
        id: 'workflow_1',
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
      },
      {
        id: 'workflow_2',
        account_id: user.account_id,
        name: 'High Value Approval',
        enabled: true,
        minAmount: 10000,
        approvers: ['approver_1', 'approver_2', 'approver_3'],
        requiredApprovals: 2,
        autoApprove: false,
        conditions: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    return apiSuccess({ workflows });
  } catch (error) {
    console.error('❌ [DEBUG] Error fetching workflows:', error);
    return apiError('Failed to fetch workflows', 500);
  }
}

/**
 * POST /api/dashboard/b2b/workflows
 * Create a new approval workflow
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const body = await request.json();
    const validationResult = ApprovalWorkflowSchema.safeParse(body);

    if (!validationResult.success) {
      return apiValidationError(validationResult.error);
    }

    const workflowData = validationResult.data;

    // TODO: In production, save to database
    const newWorkflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      account_id: user.account_id,
      ...workflowData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return apiSuccess({ workflow: newWorkflow }, 201);
  } catch (error) {
    console.error('❌ [DEBUG] Error creating workflow:', error);
    return apiError('Failed to create workflow', 500);
  }
}

