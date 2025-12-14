/**
 * Integration tests for /api/auth/send-verification route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/send-verification/route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('POST /api/auth/send-verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send verification email', async () => {
    const mockSupabase = {
      auth: {
        resend: vi.fn().mockResolvedValue({ error: null }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSupabase.auth.resend).toHaveBeenCalled();
  });

  it('should require email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Email is required');
  });
});

