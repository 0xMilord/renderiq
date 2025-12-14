/**
 * Integration tests for /api/plugins/keys route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/plugins/keys/route';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';
import { ApiKeysDAL } from '@/lib/dal/api-keys';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';

vi.mock('@/lib/utils/plugin-auth', () => ({
  authenticatePluginRequest: vi.fn(),
}));

vi.mock('@/lib/dal/api-keys', () => ({
  ApiKeysDAL: {
    create: vi.fn(),
    getByUserId: vi.fn(),
  },
}));

vi.mock('@/lib/utils/plugin-rate-limit', () => ({
  applyPluginRateLimit: vi.fn(),
}));

describe('POST /api/plugins/keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyPluginRateLimit).mockResolvedValue({ allowed: true } as any);
  });

  it('should create API key', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: 'user-id' },
        authType: 'bearer',
      },
    } as any);

    vi.mocked(ApiKeysDAL.create).mockResolvedValue({
      id: 'key-id',
      name: 'Test Key',
      key: 'rk_test_1234567890',
      keyPrefix: 'rk_test_',
      scopes: ['renders:create'],
      expiresAt: null,
      createdAt: new Date(),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/keys', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Key',
        scopes: ['renders:create'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.key).toBeDefined();
  });

  it('should require Bearer token', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: 'user-id' },
        authType: 'api_key',
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Key',
        scopes: ['renders:create'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

describe('GET /api/plugins/keys', () => {
  it('should list API keys', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: 'user-id' },
        authType: 'bearer',
      },
    } as any);

    vi.mocked(ApiKeysDAL.getByUserId).mockResolvedValue([
      { id: 'key-1', name: 'Key 1', keyPrefix: 'rk_test_' },
    ] as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/keys', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer token' },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });
});

