/**
 * Integration tests for /api/ai/generate-image route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/generate-image/route';
import { setupTestDB, teardownTestDB, createTestUser } from '../../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { AISDKService } from '@/lib/services/ai-sdk-service';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/ai-sdk-service', () => ({
  AISDKService: {
    getInstance: () => ({
      generateImage: vi.fn().mockResolvedValue({
        success: true,
        data: {
          imageUrl: 'data:image/png;base64,test',
          imageData: 'test',
        },
      }),
    }),
  },
}));

describe('POST /api/ai/generate-image', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();

    vi.mocked(getCachedUser).mockResolvedValue({
      user: testUser as any,
      fromCache: false,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  it('should generate image with valid request', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A beautiful landscape',
        quality: 'high',
        aspectRatio: '16:9',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    vi.mocked(getCachedUser).mockResolvedValue({
      user: null,
      fromCache: false,
    });

    const request = new NextRequest('http://localhost:3000/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Test',
        quality: 'high',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });
});

