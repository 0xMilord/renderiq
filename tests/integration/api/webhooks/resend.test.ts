/**
 * Integration tests for /api/webhooks/resend route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/resend/route';
import crypto from 'crypto';

describe('POST /api/webhooks/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process email.sent event', async () => {
    const payload = {
      type: 'email.sent',
      data: { email_id: 'email-123' },
    };

    const body = JSON.stringify(payload);
    const secret = 'test-secret';
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    process.env.RESEND_WEBHOOK_SECRET = secret;

    const request = new NextRequest('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: {
        'resend-signature': signature,
        'Content-Type': 'application/json',
      },
      body,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('should process email.delivered event', async () => {
    const payload = {
      type: 'email.delivered',
      data: { email_id: 'email-123' },
    };

    const body = JSON.stringify(payload);
    const secret = 'test-secret';
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    process.env.RESEND_WEBHOOK_SECRET = secret;

    const request = new NextRequest('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: {
        'resend-signature': signature,
        'Content-Type': 'application/json',
      },
      body,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('should process email.bounced event', async () => {
    const payload = {
      type: 'email.bounced',
      data: { email_id: 'email-123', bounce_type: 'hard' },
    };

    const body = JSON.stringify(payload);
    const secret = 'test-secret';
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    process.env.RESEND_WEBHOOK_SECRET = secret;

    const request = new NextRequest('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: {
        'resend-signature': signature,
        'Content-Type': 'application/json',
      },
      body,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('should verify webhook signature', async () => {
    const payload = {
      type: 'email.sent',
      data: { email_id: 'email-123' },
    };

    const body = JSON.stringify(payload);
    process.env.RESEND_WEBHOOK_SECRET = 'test-secret';

    const request = new NextRequest('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: {
        'resend-signature': 'invalid-signature',
        'Content-Type': 'application/json',
      },
      body,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Invalid signature');
  });

  it('should handle missing signature gracefully', async () => {
    const payload = {
      type: 'email.sent',
      data: { email_id: 'email-123' },
    };

    delete process.env.RESEND_WEBHOOK_SECRET;

    const request = new NextRequest('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should still process if secret not configured
    expect(response.status).toBe(200);
  });
});

