import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
}));

vi.mock('@/lib/api/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/api/plan-check', () => ({
  getUserPlan: vi.fn(),
}));

vi.mock('@/lib/ai/ai-service', () => ({
  createAIService: vi.fn(() => ({
    generateInsights: vi.fn(async () => [
      {
        category: 'abandonment',
        title: 'High abandonment rate',
        description: 'Abandonment rate is above average',
        impact: 'high',
        recommendations: ['Apply discount offers', 'Simplify checkout'],
        metadata: {},
        generatedAt: new Date(),
      },
    ]),
  })),
}));

describe('POST /api/boltx/insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate insights for valid request', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getUserPlan } = await import('@/lib/api/plan-check');
    const { getSupabaseAdmin } = await import('@/lib/supabase');

    (getAuthenticatedUser as any).mockResolvedValue({
      user: { account_id: 'test-account-123' },
    });

    (getUserPlan as any).mockResolvedValue({
      hasEnterpriseAccess: true,
    });

    const mockRpc = vi.fn()
      .mockResolvedValueOnce({
        data: [
          { event_type: 'checkout_start', session_id: 's1' },
          { event_type: 'checkout_complete', session_id: 's1' },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          { event_type: 'checkout_start', session_id: 's1', timestamp: new Date().toISOString() },
          { event_type: 'checkout_complete', session_id: 's1', timestamp: new Date().toISOString() },
        ],
        error: null,
      });

    const mockSupabase = {
      rpc: mockRpc,
      from: vi.fn(() => ({
        insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost/api/boltx/insights', {
      method: 'POST',
      body: JSON.stringify({
        category: 'abandonment',
        period: 'last_30_days',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.insights).toBeDefined();
    expect(Array.isArray(data.insights)).toBe(true);
  });

  it('should return 403 when user does not have Enterprise plan', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getUserPlan } = await import('@/lib/api/plan-check');

    (getAuthenticatedUser as any).mockResolvedValue({
      user: { account_id: 'test-account-123' },
    });

    (getUserPlan as any).mockResolvedValue({
      hasEnterpriseAccess: false,
    });

    const request = new NextRequest('http://localhost/api/boltx/insights', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });
});

describe('GET /api/boltx/insights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return stored insights', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getUserPlan } = await import('@/lib/api/plan-check');
    const { getSupabaseAdmin } = await import('@/lib/supabase');

    (getAuthenticatedUser as any).mockResolvedValue({
      user: { account_id: 'test-account-123' },
    });

    (getUserPlan as any).mockResolvedValue({
      hasEnterpriseAccess: true,
    });

    const mockInsights = [
      {
        id: '1',
        category: 'abandonment',
        title: 'Test insight',
        description: 'Test description',
        impact: 'high',
        recommendations: [],
        metadata: {},
        generated_at: new Date().toISOString(),
      },
    ];

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockInsights, error: null })),
            })),
          })),
        })),
      })),
    }));

    const mockSupabase = {
      rpc: vi.fn(),
      from: mockFrom,
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost/api/boltx/insights');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.insights).toBeDefined();
  });

  it('should filter by category when provided', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getUserPlan } = await import('@/lib/api/plan-check');
    const { getSupabaseAdmin } = await import('@/lib/supabase');

    (getAuthenticatedUser as any).mockResolvedValue({
      user: { account_id: 'test-account-123' },
    });

    (getUserPlan as any).mockResolvedValue({
      hasEnterpriseAccess: true,
    });

    const mockSupabase = {
      rpc: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
      })),
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost/api/boltx/insights?category=abandonment');

    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

