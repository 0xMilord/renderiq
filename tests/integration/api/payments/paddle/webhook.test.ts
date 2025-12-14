/**
 * Integration tests for /api/payments/paddle/webhook route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/paddle/webhook/route';
import { PaddleService } from '@/lib/services/paddle.service';

vi.mock('@/lib/services/paddle.service', () => ({
  PaddleService: vi.fn().mockImplementation(() => ({
    verifyWebhook: vi.fn(),
    handleWebhook: vi.fn(),
  })),
}));

describe('POST /api/payments/paddle/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process valid Paddle webhook', async () => {
    const payload = {
      event_name: 'transaction.completed',
      data: { transaction_id: 'txn_123' },
    };

    const mockPaddleService = {
      verifyWebhook: vi.fn().mockReturnValue(true),
      handleWebhook: vi.fn().mockResolvedValue({ success: true }),
    };

    vi.mocked(PaddleService).mockImplementation(() => mockPaddleService as any);

    const request = new NextRequest('http://localhost:3000/api/payments/paddle/webhook', {
      method: 'POST',
      headers: {
        'paddle-signature': 'valid-signature',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPaddleService.handleWebhook).toHaveBeenCalled();
  });

  it('should reject webhook without signature', async () => {
    const request = new NextRequest('http://localhost:3000/api/payments/paddle/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: 'transaction.completed' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing signature');
  });

  it('should reject webhook with invalid signature', async () => {
    const mockPaddleService = {
      verifyWebhook: vi.fn().mockReturnValue(false),
      handleWebhook: vi.fn(),
    };

    vi.mocked(PaddleService).mockImplementation(() => mockPaddleService as any);

    const request = new NextRequest('http://localhost:3000/api/payments/paddle/webhook', {
      method: 'POST',
      headers: {
        'paddle-signature': 'invalid-signature',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_name: 'transaction.completed' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid signature');
  });

  it('should handle webhook processing errors', async () => {
    const mockPaddleService = {
      verifyWebhook: vi.fn().mockReturnValue(true),
      handleWebhook: vi.fn().mockResolvedValue({ success: false, error: 'Processing failed' }),
    };

    vi.mocked(PaddleService).mockImplementation(() => mockPaddleService as any);

    const request = new NextRequest('http://localhost:3000/api/payments/paddle/webhook', {
      method: 'POST',
      headers: {
        'paddle-signature': 'valid-signature',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_name: 'transaction.completed' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});

