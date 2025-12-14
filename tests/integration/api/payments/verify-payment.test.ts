/**
 * Integration tests for /api/payments/verify-payment route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/verify-payment/route';
import { setupTestDB, teardownTestDB, createTestUser } from '../../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { BillingService } from '@/lib/services/billing';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/billing', () => ({
  BillingService: {
    verifyPayment: vi.fn(),
  },
}));

describe('POST /api/payments/verify-payment', () => {
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

  it('should verify payment', async () => {
    vi.mocked(BillingService.verifyPayment).mockResolvedValue({
      success: true,
      data: {
        orderId: 'order-123',
        creditsAdded: 1000,
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/payments/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'order-123',
        paymentId: 'payment-123',
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

    const request = new NextRequest('http://localhost:3000/api/payments/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'order-123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

