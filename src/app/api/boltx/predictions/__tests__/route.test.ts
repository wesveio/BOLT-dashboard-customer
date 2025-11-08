import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock dependencies (same as realtime tests)
vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    rpc: vi.fn(),
  })),
}));

vi.mock('@/lib/api/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/api/plan-check', () => ({
  getUserPlan: vi.fn(),
}));

vi.mock('@/lib/ai/ai-service', () => ({
  createAIService: vi.fn(() => ({})),
}));

vi.mock('@/lib/ai/models/abandonment-predictor', () => ({
  EnhancedAbandonmentPredictor: vi.fn(() => ({
    predict: vi.fn((features: any) => ({
      riskScore: 60,
      riskLevel: 'high',
      confidence: 0.75,
      factors: ['timeExceeded'],
      recommendations: ['Show security badge'],
      interventionSuggested: true,
      interventionType: 'security',
    })),
  })),
}));

describe('GET /api/boltx/predictions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return prediction for valid session', async () => {
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
      rpc: vi.fn()
        .mockResolvedValueOnce({
          data: [
            {
              session_id: 'test-session-123',
              event_type: 'checkout_start',
              timestamp: new Date().toISOString(),
            },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [],
        })
        .mockResolvedValueOnce({
          data: [],
        })
        .mockResolvedValueOnce({
          data: [],
        }),
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest(
      'http://localhost/api/boltx/predictions?sessionId=test-session-123'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('riskScore');
    expect(data.riskScore).toBe(60);
  });

  it('should return 400 when sessionId is missing', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getUserPlan } = await import('@/lib/api/plan-check');

    (getAuthenticatedUser as any).mockResolvedValue({
      user: { account_id: 'test-account-123' },
    });

    (getUserPlan as any).mockResolvedValue({
      hasEnterpriseAccess: true,
    });

    const request = new NextRequest('http://localhost/api/boltx/predictions');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Session ID is required');
  });

  it('should return 404 when session not found', async () => {
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
      rpc: vi.fn().mockResolvedValueOnce({
        data: [],
        error: null,
      }),
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest(
      'http://localhost/api/boltx/predictions?sessionId=non-existent'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Session not found');
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

    const request = new NextRequest(
      'http://localhost/api/boltx/predictions?sessionId=test-session-123'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
  });

  it('should store prediction in database', async () => {
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
          {
            session_id: 'test-session-123',
            event_type: 'checkout_start',
            timestamp: new Date().toISOString(),
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [],
      })
      .mockResolvedValueOnce({
        data: [],
      })
      .mockResolvedValueOnce({
        data: [],
      }); // insert_ai_prediction

    const mockSupabase = {
      rpc: mockRpc,
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest(
      'http://localhost/api/boltx/predictions?sessionId=test-session-123'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    // Verify insert_ai_prediction was called
    expect(mockRpc).toHaveBeenCalledWith(
      'insert_ai_prediction',
      expect.objectContaining({
        p_session_id: 'test-session-123',
        p_prediction_type: 'abandonment',
      })
    );
  });
});

