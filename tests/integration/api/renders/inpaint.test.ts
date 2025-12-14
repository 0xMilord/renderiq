/**
 * Integration tests for /api/renders/inpaint route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/renders/inpaint/route';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject, createTestRender } from '../../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { MaskInpaintingService } from '@/lib/services/mask-inpainting';
import { RendersDAL } from '@/lib/dal/renders';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/mask-inpainting', () => ({
  MaskInpaintingService: {
    generateInpainted: vi.fn(),
  },
}));
vi.mock('@/lib/dal/renders', () => ({
  RendersDAL: {
    create: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
    updateOutput: vi.fn(),
    updateContext: vi.fn(),
  },
}));

describe('POST /api/renders/inpaint', () => {
  let testUser: any;
  let testProject: any;
  let testRender: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id);
    testRender = await createTestRender(testUser.id, testProject.id, {
      outputUrl: 'https://example.com/image.jpg',
    });

    vi.mocked(getCachedUser).mockResolvedValue({
      user: testUser as any,
      fromCache: false,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  it('should generate inpainted image', async () => {
    vi.mocked(MaskInpaintingService.generateInpainted).mockResolvedValue({
      success: true,
      imageUrl: 'https://example.com/inpainted.jpg',
    } as any);

    vi.mocked(RendersDAL.getById).mockResolvedValue({
      id: testRender.id,
      userId: testUser.id,
      outputUrl: 'https://example.com/image.jpg',
      prompt: 'Test prompt',
      settings: { style: 'photorealistic', quality: 'high', aspectRatio: '16:9' },
      projectId: testProject.id,
      chainId: null,
      chainPosition: null,
    } as any);

    vi.mocked(RendersDAL.create).mockResolvedValue({
      id: 'new-render-id',
      outputUrl: 'https://example.com/inpainted.jpg',
      chainId: null,
      chainPosition: 1,
    } as any);

    const request = new NextRequest('http://localhost:3000/api/renders/inpaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        renderId: testRender.id,
        maskData: 'base64maskdata',
        prompt: 'Add a garden',
        quality: 'high',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(MaskInpaintingService.generateInpainted).toHaveBeenCalled();
  });

  it('should require authentication', async () => {
    vi.mocked(getCachedUser).mockResolvedValue({
      user: null,
      fromCache: false,
    });

    const request = new NextRequest('http://localhost:3000/api/renders/inpaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        renderId: testRender.id,
        maskData: 'base64maskdata',
        prompt: 'Add a garden',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/renders/inpaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        renderId: testRender.id,
        // Missing maskData and prompt
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing required fields');
  });

  it('should verify render ownership', async () => {
    const { randomUUID } = await import('crypto');
    const otherUser = await createTestUser({ id: randomUUID() });
    const otherRender = await createTestRender(otherUser.id, testProject.id);

    const request = new NextRequest('http://localhost:3000/api/renders/inpaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        renderId: otherRender.id,
        maskData: 'base64maskdata',
        prompt: 'Add a garden',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });
});

