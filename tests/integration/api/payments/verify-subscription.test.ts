/**
 * Integration tests for /api/payments/verify-subscription route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/verify-subscription/route';
import { setupTestDB, teardownTestDB, createTestUser } from '../../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { db } from '@/lib/db';
import { userSubscriptions } from '@/lib/db/schema';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/razorpay.service', () => ({
  RazorpayService: {
    verifySubscriptionPayment: vi.fn(),
    getSubscriptionDetails: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

describe('POST /api/payments/verify-subscription', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();

    vi.mocked(getCachedUser).mockResolvedValue({
      user: testUser as any,
      fromCache: false,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  it('should verify subscription payment', async () => {
    vi.mocked(RazorpayService.verifySubscriptionPayment).mockResolvedValue({
      success: true,
      data: {
        subscriptionId: 'sub_123',
        paymentId: 'pay_123',
      },
    } as any);

    vi.mocked(RazorpayService.getSubscriptionDetails).mockResolvedValue({
      success: true,
      data: {
        id: 'sub_123',
        status: 'active',
      },
    } as any);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/verify-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: 'sub_123',
        paymentId: 'pay_123',
        signature: 'sig_123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should require authentication', async () => {
    vi.mocked(getCachedUser).mockResolvedValue({
      user: null,
      fromCache: false,
    });

    const request = new NextRequest('http://localhost:3000/api/payments/verify-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: 'sub_123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should require subscription ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/payments/verify-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});

