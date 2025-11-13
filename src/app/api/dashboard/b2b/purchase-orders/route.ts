import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiSuccess, apiError } from '@/lib/api/responses';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/b2b/purchase-orders
 * Get purchase orders and configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const searchParams = request.nextUrl.searchParams;
    const buyerId = searchParams.get('buyerId');
    const status = searchParams.get('status');

    // TODO: In production, fetch from database
    const orders = [
      {
        id: 'po_1',
        account_id: user.account_id,
        poNumber: 'PO-1234567890-ABC123',
        buyerId: 'buyer_1',
        amount: 5000,
        status: 'pending_approval',
        items: [
          {
            productId: 'prod_1',
            name: 'Product 1',
            quantity: 10,
            price: 500,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    let filteredOrders = orders;

    if (buyerId) {
      filteredOrders = filteredOrders.filter((o) => o.buyerId === buyerId);
    }

    if (status) {
      filteredOrders = filteredOrders.filter((o) => o.status === status);
    }

    // Configuration
    const config = {
      prefix: 'PO',
      autoGenerate: true,
      requiredFields: ['buyerId', 'amount'],
    };

    return apiSuccess({ orders: filteredOrders, config });
  } catch (error) {
    console.error('❌ [DEBUG] Error fetching purchase orders:', error);
    return apiError('Failed to fetch purchase orders', 500);
  }
}

/**
 * POST /api/dashboard/b2b/purchase-orders
 * Create purchase order or update configuration
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user.account_id) {
      return apiError('User account not found', 404);
    }

    const body = await request.json();

    // Check if it's a configuration update
    if (body.type === 'config') {
      // TODO: In production, save config to database
      return apiSuccess({ config: body.config });
    }

    // Otherwise, create a new PO
    const { poNumber, buyerId, amount, items } = body;

    if (!poNumber || !buyerId || !amount || !items) {
      return apiError('Missing required fields', 400);
    }

    // TODO: In production, save to database
    const newOrder = {
      id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      account_id: user.account_id,
      poNumber,
      buyerId,
      amount,
      status: 'draft',
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return apiSuccess({ order: newOrder }, 201);
  } catch (error) {
    console.error('❌ [DEBUG] Error creating purchase order:', error);
    return apiError('Failed to create purchase order', 500);
  }
}

