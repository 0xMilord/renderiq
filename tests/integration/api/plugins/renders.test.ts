/**
 * Integration tests for /api/plugins/renders route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/plugins/renders/route';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject } from '../../../fixtures/database';
import { authenticatePluginRequest } from '@/lib/utils/plugin-auth';

vi.mock('@/lib/utils/plugin-auth', () => ({
  authenticatePluginRequest: vi.fn(),
}));

describe('POST /api/plugins/renders', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id);

    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: testUser.id },
        authType: 'bearer',
      },
    } as any);
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  it('should create render with Bearer token', async () => {
    const request = new NextRequest('http://localhost:3000/api/plugins/renders', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Test render',
        projectId: testProject.id,
        quality: 'high',
        aspectRatio: '16:9',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should create render with API key', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: testUser.id },
        authType: 'api_key',
        apiKey: {
          id: 'key-123',
          scopes: ['renders:write'],
        },
      },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/renders', {
      method: 'POST',
      headers: {
        'x-api-key': 'valid-api-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Test render',
        projectId: testProject.id,
        quality: 'high',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: false,
      error: 'Authentication required',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/renders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Test',
        projectId: testProject.id,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

