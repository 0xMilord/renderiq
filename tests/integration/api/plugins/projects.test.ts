/**
 * Integration tests for /api/plugins/projects route
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/plugins/projects/route';
import { authenticatePluginRequest, hasRequiredScope } from '@/lib/utils/plugin-auth';
import { ProjectsDAL } from '@/lib/dal/projects';
import { applyPluginRateLimit } from '@/lib/utils/plugin-rate-limit';

vi.mock('@/lib/utils/plugin-auth', () => ({
  authenticatePluginRequest: vi.fn(),
  hasRequiredScope: vi.fn(),
}));

vi.mock('@/lib/dal/projects', () => ({
  ProjectsDAL: {
    getByUserId: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/utils/plugin-rate-limit', () => ({
  applyPluginRateLimit: vi.fn(),
}));

describe('GET /api/plugins/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applyPluginRateLimit).mockResolvedValue({ allowed: true } as any);
    vi.mocked(hasRequiredScope).mockReturnValue(true);
  });

  it('should list projects', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: 'user-id' },
        authType: 'bearer',
      },
    } as any);

    vi.mocked(ProjectsDAL.getByUserId).mockResolvedValue([
      { id: 'project-1', name: 'Project 1', slug: 'project-1' },
    ] as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/projects', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer token' },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.projects).toBeDefined();
  });

  it('should check scope for API key auth', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: 'user-id' },
        authType: 'api_key',
      },
    } as any);

    vi.mocked(hasRequiredScope).mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/plugins/projects', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer api-key' },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});

describe('POST /api/plugins/projects', () => {
  it('should create project', async () => {
    vi.mocked(authenticatePluginRequest).mockResolvedValue({
      success: true,
      auth: {
        user: { id: 'user-id' },
        authType: 'bearer',
      },
    } as any);

    vi.mocked(ProjectsDAL.create).mockResolvedValue({
      id: 'project-1',
      name: 'New Project',
      slug: 'new-project',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/plugins/projects', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Project',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});

