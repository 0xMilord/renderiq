/**
 * Integration tests for /api/webhooks/supabase-auth route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/supabase-auth/route';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/services/email.service';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/email.service', () => ({
  sendWelcomeEmail: vi.fn(),
}));

describe('POST /api/webhooks/supabase-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  it('should process INSERT event for new user', async () => {
    const mockAdminClient = {
      auth: {
        admin: {
          generateLink: vi.fn().mockResolvedValue({
            data: { properties: { action_link: 'https://example.com/verify' } },
            error: null,
          }),
        },
      },
    };

    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as any);

    const payload = {
      type: 'INSERT',
      table: 'auth.users',
      record: {
        id: 'user-id',
        email: 'test@example.com',
        email_confirmed_at: null,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-auth', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('should process UPDATE event for email verification', async () => {
    vi.mocked(sendWelcomeEmail).mockResolvedValue({
      success: true,
    });

    const payload = {
      type: 'UPDATE',
      table: 'auth.users',
      record: {
        id: 'user-id',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
      },
      old_record: {
        id: 'user-id',
        email: 'test@example.com',
        email_confirmed_at: null,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-auth', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('should require authorization', async () => {
    const payload = {
      type: 'INSERT',
      table: 'auth.users',
      record: { id: 'user-id', email: 'test@example.com' },
    };

    const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('should ignore non-auth.users table events', async () => {
    const payload = {
      type: 'INSERT',
      table: 'other_table',
      record: { id: 'record-id' },
    };

    const request = new NextRequest('http://localhost:3000/api/webhooks/supabase-auth', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });
});

