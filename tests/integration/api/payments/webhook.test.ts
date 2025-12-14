/**
 * Integration tests for /api/payments/webhook route (Razorpay)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/webhook/route';
import { RazorpayService } from '@/lib/services/razorpay.service';

vi.mock('@/lib/services/razorpay.service', () => ({
  RazorpayService: {
    verifyWebhookSignature: vi.fn(),
    handleWebhook: vi.fn(),
  },
}));

describe('POST /api/payments/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process valid webhook', async () => {
    const payload = {
      event: 'payment.captured',
      payload: { order_id: 'order_123' },
    };

    vi.mocked(RazorpayService.verifyWebhookSignature).mockReturnValue(true);
    vi.mocked(RazorpayService.handleWebhook).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'X-Razorpay-Signature': 'valid-signature',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(RazorpayService.handleWebhook).toHaveBeenCalledWith(payload.event, payload);
  });

  it('should reject webhook without signature', async () => {
    const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.captured' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing signature');
  });

  it('should reject webhook with invalid signature', async () => {
    vi.mocked(RazorpayService.verifyWebhookSignature).mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'X-Razorpay-Signature': 'invalid-signature',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: 'payment.captured' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid signature');
  });

  it('should handle webhook processing errors', async () => {
    vi.mocked(RazorpayService.verifyWebhookSignature).mockReturnValue(true);
    vi.mocked(RazorpayService.handleWebhook).mockRejectedValue(new Error('Processing failed'));

    const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'X-Razorpay-Signature': 'valid-signature',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: 'payment.captured' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

