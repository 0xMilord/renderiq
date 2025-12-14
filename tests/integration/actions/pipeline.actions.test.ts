/**
 * Integration tests for pipeline actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateRenderWithPipeline,
  generateVideoWithPipeline,
} from '@/lib/actions/pipeline.actions';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject } from '../../fixtures/database';
import { getUserFromAction } from '@/lib/utils/get-user-from-action';
import { RenderPipeline } from '@/lib/services/render-pipeline';
import { VideoPipeline } from '@/lib/services/video-pipeline';

vi.mock('@/lib/utils/get-user-from-action');
vi.mock('@/lib/services/render-pipeline', () => ({
  RenderPipeline: {
    generateRender: vi.fn(),
    quickRender: vi.fn(),
  },
}));

vi.mock('@/lib/services/video-pipeline', () => ({
  VideoPipeline: {
    generateVideo: vi.fn(),
  },
}));

describe('Pipeline Actions', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id);

    vi.mocked(getUserFromAction).mockResolvedValue({
      user: testUser as any,
      userId: testUser.id,
      fromCache: false,
    });
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  describe('generateRenderWithPipeline', () => {
    it('should generate render with full pipeline', async () => {
      vi.mocked(RenderPipeline.generateRender).mockResolvedValue({
        success: true,
        data: { renderId: 'render-123' },
      } as any);

      const result = await generateRenderWithPipeline({
        prompt: 'Test prompt',
        quality: 'high',
        aspectRatio: '16:9',
        projectId: testProject.id,
        enableFullPipeline: true,
      });

      expect(result.success).toBe(true);
      expect(RenderPipeline.generateRender).toHaveBeenCalled();
    });

    it('should use quick render when full pipeline disabled', async () => {
      vi.mocked(RenderPipeline.quickRender).mockResolvedValue({
        success: true,
        data: { renderId: 'render-123' },
      } as any);

      const result = await generateRenderWithPipeline({
        prompt: 'Test prompt',
        quality: 'standard',
        aspectRatio: '16:9',
        projectId: testProject.id,
        enableFullPipeline: false,
      });

      expect(result.success).toBe(true);
      expect(RenderPipeline.quickRender).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      vi.mocked(getUserFromAction).mockResolvedValue({
        user: null,
        userId: null,
        fromCache: false,
      });

      const result = await generateRenderWithPipeline({
        prompt: 'Test',
        quality: 'standard',
        aspectRatio: '16:9',
        projectId: testProject.id,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });
  });

  describe('generateVideoWithPipeline', () => {
    it('should generate video with pipeline', async () => {
      vi.mocked(VideoPipeline.generateVideo).mockResolvedValue({
        success: true,
        data: { videoId: 'video-123' },
      } as any);

      const result = await generateVideoWithPipeline({
        prompt: 'Test video',
        quality: 'high',
        aspectRatio: '16:9',
        projectId: testProject.id,
      });

      expect(result.success).toBe(true);
      expect(VideoPipeline.generateVideo).toHaveBeenCalled();
    });
  });
});

