/**
 * Integration tests for /api/plugins/auth/signin route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/plugins/auth/signin/route';
import { createClient } from '@/lib/supabase/server';
import { detectPlatform } from '@/lib/utils/platform-detection';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/utils/platform-detection', () => ({
  detectPlatform: vi.fn(),
}));

vi.mock('@/lib/utils/plugin-rate-limit', () => ({
  applyPluginRateLimit: vi.fn(),
}));

describe('POST /api/plugins/auth/signin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(detectPlatform).mockReturnValue({ platform: 'figma', version: '1.0.0' } as any);
    vi.mocked(applyPluginRateLimit).mockResolvedValue({ allowed: true } as any);
  });

  it('should authenticate plugin user', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'user-id', email: 'test@example.com' },
          },
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'token',
              refresh_token: 'refresh',
              expires_at: Date.now() / 1000 + 3600,
            },
          },
          error: null,
        }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.access_token).toBeDefined();
  });

  it('should require email and password', async () => {
    const request = new NextRequest('http://localhost:3000/api/plugins/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should enforce rate limiting', async () => {
    vi.mocked(applyPluginRateLimit).mockResolvedValue({
      allowed: false,
      response: new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
  });
});

