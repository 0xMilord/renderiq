/**
 * Integration tests for /api/auth/forgot-password route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/forgot-password/route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send password reset email', async () => {
    const mockSupabase = {
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalled();
  });

  it('should require email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Email is required');
  });

  it('should handle errors gracefully', async () => {
    const mockSupabase = {
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: new Error('Failed') }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should still return success for security (don't reveal if email exists)
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

