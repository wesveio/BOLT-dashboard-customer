import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock dependencies
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
    predict: vi.fn(() => ({
      riskScore: 75,
      riskLevel: 'critical',
      confidence: 0.85,
      factors: ['timeExceeded', 'errorCount'],
      recommendations: ['Apply discount', 'Show security badge'],
      interventionSuggested: true,
      interventionType: 'discount',
    })),
  })),
}));

describe('GET /api/boltx/realtime', () => {
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
              metadata: { deviceType: 'mobile' },
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
        })
        .mockResolvedValueOnce({
          data: [],
        }),
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest(
      'http://localhost/api/boltx/realtime?sessionId=test-session-123'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prediction).toHaveProperty('riskScore');
    expect(data.prediction).toHaveProperty('riskLevel');
    expect(data.prediction.riskScore).toBe(75);
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

    const request = new NextRequest('http://localhost/api/boltx/realtime');

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
      'http://localhost/api/boltx/realtime?sessionId=non-existent'
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
      error: 'BoltX is only available on Enterprise plan',
    });

    const request = new NextRequest(
      'http://localhost/api/boltx/realtime?sessionId=test-session-123'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Enterprise plan');
  });

  it('should return 404 when user account not found', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getUserPlan } = await import('@/lib/api/plan-check');

    (getAuthenticatedUser as any).mockResolvedValue({
      user: { account_id: null },
    });

    (getUserPlan as any).mockResolvedValue({
      hasEnterpriseAccess: true,
    });

    const request = new NextRequest(
      'http://localhost/api/boltx/realtime?sessionId=test-session-123'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('User account not found');
  });

  it('should build prediction features from events correctly', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getUserPlan } = await import('@/lib/api/plan-check');
    const { getSupabaseAdmin } = await import('@/lib/supabase');

    (getAuthenticatedUser as any).mockResolvedValue({
      user: { account_id: 'test-account-123' },
    });

    (getUserPlan as any).mockResolvedValue({
      hasEnterpriseAccess: true,
    });

    const mockEvents = [
      {
        session_id: 'test-session-123',
        event_type: 'checkout_start',
        timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        step: 'cart',
        metadata: { deviceType: 'mobile' },
      },
      {
        session_id: 'test-session-123',
        event_type: 'step_viewed',
        timestamp: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
        step: 'profile',
      },
      {
        session_id: 'test-session-123',
        event_type: 'error_occurred',
        timestamp: new Date().toISOString(),
        step: 'profile',
      },
    ];

    const mockSupabase = {
      rpc: vi.fn()
        .mockResolvedValueOnce({
          data: mockEvents,
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
        })
        .mockResolvedValueOnce({
          data: [],
        }),
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest(
      'http://localhost/api/boltx/realtime?sessionId=test-session-123'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prediction).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Mock console.error to suppress expected error logs during this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    try {
      const { getAuthenticatedUser } = await import('@/lib/api/auth');
      const { getUserPlan } = await import('@/lib/api/plan-check');

      (getAuthenticatedUser as any).mockRejectedValue(new Error('Database error'));

      (getUserPlan as any).mockResolvedValue({
        hasEnterpriseAccess: true,
      });

      const request = new NextRequest(
        'http://localhost/api/boltx/realtime?sessionId=test-session-123'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Internal server error');
    } finally {
      // Restore original console.error
      console.error = originalConsoleError;
    }
  });
});

