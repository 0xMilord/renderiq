/**
 * Integration tests for /api/plugins/auth/me route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/plugins/auth/me/route';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';
import { BillingDAL } from '@/lib/dal/billing';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';

vi.mock('@/lib/utils/plugin-auth', () => ({
  authenticatePluginRequest: vi.fn(),
}));

vi.mock('@/lib/dal/billing', () => ({
  BillingDAL: {
    getUserCreditsWithResetAndMonthly: vi.fn(),
  },
}));

vi.mock('@/lib/utils/plugin-rate-limit', () => ({
  applyPluginRateLimit: vi.fn(),
}));

describe('GET /api/plugins/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyPluginRateLimit).mockResolvedValue({ allowed: true } as any);
  });

  it('should get user info with credits', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' },
          created_at: '2025-01-01',
        },
        authType: 'bearer',
      },
    } as any);

    vi.mocked(BillingDAL.getUserCreditsWithResetAndMonthly).mockResolvedValue({
      balance: 1000,
      totalEarned: 2000,
      totalSpent: 1000,
      monthlyEarned: 500,
      monthlySpent: 200,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/auth/me', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer token' },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.id).toBe('user-id');
    expect(data.user.credits).toBeDefined();
  });

  it('should require authentication', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: false,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/auth/me', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

