import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError, apiValidationError } from '@/lib/api/responses';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreditLimitSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  limit: z.number().min(0, 'Limit must be positive'),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
});

/**
 * GET /api/dashboard/b2b/credit-limits
 * Get all credit limits for the account
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // TODO: In production, fetch from database
    const limits = [
      {
        id: 'limit_1',
        account_id: user.account_id,
        userId: userId || 'user_1',
        limit: 10000,
        used: 3500,
        available: 6500,
        period: 'monthly',
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const filteredLimits = userId
      ? limits.filter((l) => l.userId === userId)
      : limits;

    return apiSuccess({ limits: filteredLimits });
  } catch (error) {
    console.error('❌ [DEBUG] Error fetching credit limits:', error);
    return apiError('Failed to fetch credit limits', 500);
  }
}

/**
 * POST /api/dashboard/b2b/credit-limits
 * Create or update a credit limit
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const body = await request.json();
    const validationResult = CreditLimitSchema.safeParse(body);

    if (!validationResult.success) {
      return apiValidationError(validationResult.error);
    }

    const limitData = validationResult.data;

    // TODO: In production, save to database
    const newLimit = {
      id: `limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      account_id: user.account_id,
      ...limitData,
      used: 0,
      available: limitData.limit,
      resetDate: calculateResetDate(limitData.period),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return apiSuccess({ limit: newLimit }, 201);
  } catch (error) {
    console.error('❌ [DEBUG] Error creating credit limit:', error);
    return apiError('Failed to create credit limit', 500);
  }
}

function calculateResetDate(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): string {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;
  const oneYear = 365 * oneDay;

  switch (period) {
    case 'daily':
      return new Date(now + oneDay).toISOString();
    case 'weekly':
      return new Date(now + oneWeek).toISOString();
    case 'monthly':
      return new Date(now + oneMonth).toISOString();
    case 'yearly':
      return new Date(now + oneYear).toISOString();
  }
}

