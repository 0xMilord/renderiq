/**
 * Integration tests for /api/video route
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/video/route';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject } from '../../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { VideoPipeline } from '@/lib/services/video-pipeline';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/video-pipeline', () => ({
  VideoPipeline: {
    generateVideo: vi.fn().mockResolvedValue({
      success: true,
      data: { videoId: 'video-123' },
    }),
  },
}));

describe('POST /api/video', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id);

    vi.mocked(getCachedUser).mockResolvedValue({
      user: testUser as any,
      fromCache: false,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  it('should generate video with valid request', async () => {
    const formData = new FormData();
    formData.append('prompt', 'A beautiful video');
    formData.append('quality', 'high');
    formData.append('aspectRatio', '16:9');
    formData.append('projectId', testProject.id);

    const request = new NextRequest('http://localhost:3000/api/video', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

