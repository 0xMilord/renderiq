/**
 * Integration tests for /api/auth/invalidate-cache route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/invalidate-cache/route';
import { invalidateUserCache } from '@/lib/services/auth-cache';

vi.mock('@/lib/services/auth-cache', () => ({
  invalidateUserCache: vi.fn(),
}));

describe('POST /api/auth/invalidate-cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should invalidate user cache', async () => {
    vi.mocked(invalidateUserCache).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/auth/invalidate-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-id' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(invalidateUserCache).toHaveBeenCalledWith('user-id');
  });

  it('should require userId', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/invalidate-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid userId');
  });
});

