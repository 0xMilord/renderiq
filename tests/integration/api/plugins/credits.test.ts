/**
 * Integration tests for /api/plugins/credits route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/plugins/credits/route';
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

describe('GET /api/plugins/credits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyPluginRateLimit).mockResolvedValue({ allowed: true } as any);
  });

  it('should get user credits', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: 'user-id' },
      },
    } as any);

    vi.mocked(BillingDAL.getUserCreditsWithResetAndMonthly).mockResolvedValue({
      balance: 1000,
      totalEarned: 2000,
      totalSpent: 1000,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/credits', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer token' },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.balance).toBe(1000);
  });

  it('should require authentication', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: false,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/credits', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

