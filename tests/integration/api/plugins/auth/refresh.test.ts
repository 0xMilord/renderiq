/**
 * Integration tests for /api/plugins/auth/refresh route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/plugins/auth/refresh/route';
import { createClient } from '@/lib/supabase/server';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/utils/plugin-rate-limit', () => ({
  applyPluginRateLimit: vi.fn(),
}));

describe('POST /api/plugins/auth/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyPluginRateLimit).mockResolvedValue({ allowed: true } as any);
  });

  it('should refresh access token', async () => {
    const mockSupabase = {
      auth: {
        refreshSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'new-token',
              refresh_token: 'new-refresh-token',
              expires_at: Date.now() / 1000 + 3600,
            },
            user: { id: 'user-id' },
          },
          error: null,
        }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: 'refresh-token' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.access_token).toBe('new-token');
  });

  it('should require refresh token', async () => {
    const request = new NextRequest('http://localhost:3000/api/plugins/auth/refresh', {
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

