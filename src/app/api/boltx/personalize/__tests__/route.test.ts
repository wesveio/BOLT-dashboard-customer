import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

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

describe('GET /api/boltx/personalize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return personalization config for valid session', async () => {
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
              device_type: 'mobile',
              browser: 'Chrome',
              location: { country: 'US' },
              behavior: {},
              preferences: {},
            },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        }),
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest(
      'http://localhost/api/boltx/personalize?sessionId=test-session-123&step=profile'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('fieldOrder');
    expect(data).toHaveProperty('highlightedOptions');
    expect(data).toHaveProperty('messages');
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

    const request = new NextRequest('http://localhost/api/boltx/personalize');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Session ID is required');
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
      'http://localhost/api/boltx/personalize?sessionId=test-session-123'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
  });

  it('should generate mobile-first layout for mobile devices', async () => {
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
              device_type: 'mobile',
              browser: 'Chrome',
              behavior: {},
              preferences: {},
            },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        }),
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest(
      'http://localhost/api/boltx/personalize?sessionId=test-session-123'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.layoutVariant).toBe('mobile-first');
  });
});

describe('POST /api/boltx/personalize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update user profile', async () => {
    const { getAuthenticatedUser } = await import('@/lib/api/auth');
    const { getUserPlan } = await import('@/lib/api/plan-check');
    const { getSupabaseAdmin } = await import('@/lib/supabase');

    (getAuthenticatedUser as any).mockResolvedValue({
      user: { account_id: 'test-account-123' },
    });

    (getUserPlan as any).mockResolvedValue({
      hasEnterpriseAccess: true,
    });

    const mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockSupabase = {
      rpc: mockRpc,
    };

    (getSupabaseAdmin as any).mockReturnValue(mockSupabase);

    const request = new NextRequest('http://localhost/api/boltx/personalize', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'test-session-123',
        deviceType: 'mobile',
        browser: 'Chrome',
        location: { country: 'US' },
        behavior: {},
        preferences: {},
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith(
      'update_user_profile',
      expect.objectContaining({
        p_session_id: 'test-session-123',
        p_device_type: 'mobile',
      })
    );
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

    const request = new NextRequest('http://localhost/api/boltx/personalize', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Session ID is required');
  });
});

