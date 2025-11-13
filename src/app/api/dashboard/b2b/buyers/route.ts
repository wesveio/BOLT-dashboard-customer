import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/responses';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BuyerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['buyer', 'approver', 'admin']),
  costCenter: z.string().optional(),
  department: z.string().optional(),
  projectCode: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
});

/**
 * GET /api/dashboard/b2b/buyers
 * Get all buyers for the account
 */
export async function GET(_request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    // TODO: In production, fetch from database
    const buyers = [
      {
        id: 'buyer_1',
        account_id: user.account_id,
        email: 'buyer1@example.com',
        name: 'John Doe',
        role: 'buyer',
        costCenter: 'CC001',
        department: 'Sales',
        projectCode: 'PROJ001',
        creditLimit: 10000,
        availableCredit: 6500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'buyer_2',
        account_id: user.account_id,
        email: 'buyer2@example.com',
        name: 'Jane Smith',
        role: 'buyer',
        costCenter: 'CC002',
        department: 'Marketing',
        projectCode: 'PROJ002',
        creditLimit: 5000,
        availableCredit: 5000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'approver_1',
        account_id: user.account_id,
        email: 'approver1@example.com',
        name: 'Bob Johnson',
        role: 'approver',
        costCenter: 'CC001',
        department: 'Finance',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    return apiSuccess({ buyers });
  } catch (error) {
    console.error('❌ [DEBUG] Error fetching buyers:', error);
    return apiError('Failed to fetch buyers', 500);
  }
}

/**
 * POST /api/dashboard/b2b/buyers
 * Create a new buyer
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const body = await request.json();
    const validationResult = BuyerSchema.safeParse(body);

    if (!validationResult.success) {
      return apiValidationError(validationResult.error);
    }

    const buyerData = validationResult.data;

    // TODO: In production, save to database
    const newBuyer = {
      id: `buyer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      account_id: user.account_id,
      ...buyerData,
      availableCredit: buyerData.creditLimit || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return apiSuccess({ buyer: newBuyer }, 201);
  } catch (error) {
    console.error('❌ [DEBUG] Error creating buyer:', error);
    return apiError('Failed to create buyer', 500);
  }
}

