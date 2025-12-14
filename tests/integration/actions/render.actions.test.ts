/**
 * Integration tests for render actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRenderAction } from '@/lib/actions/render.actions';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { BillingDAL } from '@/lib/dal/billing';
import { ProjectsDAL } from '@/lib/dal/projects';

// Mock dependencies
vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/ai-sdk-service', () => ({
  AISDKService: {
    getInstance: () => ({
      generateImage: vi.fn().mockResolvedValue({
        success: true,
        data: {
          imageUrl: 'data:image/png;base64,test',
          imageData: 'test',
          processingTime: 5000,
          provider: 'google-gemini',
        },
      }),
    }),
  },
}));

describe('Render Actions', () => {
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testProject = await createTestProject(testUser.id);

    // Mock auth
    vi.mocked(getCachedUser).mockResolvedValue({
      user: testUser as any,
      fromCache: false,
    });

    // Mock billing - user has credits
    vi.spyOn(BillingDAL, 'getUserCredits').mockResolvedValue({
      id: 'credits-123',
      userId: testUser.id,
      balance: 1000,
      totalEarned: 1000,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.spyOn(BillingDAL, 'isUserPro').mockResolvedValue(false);
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  describe('createRenderAction', () => {
    it('should create a render with valid form data', async () => {
      const formData = new FormData();
      formData.append('prompt', 'A beautiful modern house');
      formData.append('style', 'photorealistic');
      formData.append('quality', 'standard');
      formData.append('aspectRatio', '16:9');
      formData.append('type', 'image');
      formData.append('projectId', testProject.id);
      formData.append('userId', testUser.id);

      const result = await createRenderAction(formData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.renderId).toBeDefined();
    });

    it('should reject render without authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const formData = new FormData();
      formData.append('prompt', 'Test prompt');
      formData.append('style', 'photorealistic');
      formData.append('quality', 'standard');
      formData.append('aspectRatio', '16:9');
      formData.append('type', 'image');
      formData.append('projectId', testProject.id);

      const result = await createRenderAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });

    it('should reject render with missing required fields', async () => {
      const formData = new FormData();
      formData.append('prompt', 'Test prompt');
      // Missing style, quality, aspectRatio, type, projectId
      formData.append('userId', testUser.id);

      const result = await createRenderAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject render with insufficient credits', async () => {
      vi.spyOn(BillingDAL, 'getUserCredits').mockResolvedValue({
        id: 'credits-123',
        userId: testUser.id,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const formData = new FormData();
      formData.append('prompt', 'Test prompt');
      formData.append('style', 'photorealistic');
      formData.append('quality', 'standard');
      formData.append('aspectRatio', '16:9');
      formData.append('type', 'image');
      formData.append('projectId', testProject.id);
      formData.append('userId', testUser.id);

      const result = await createRenderAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('credits');
    });

    it('should create render with reference render', async () => {
      // Create a reference render first
      const referenceFormData = new FormData();
      referenceFormData.append('prompt', 'First render');
      referenceFormData.append('style', 'photorealistic');
      referenceFormData.append('quality', 'standard');
      referenceFormData.append('aspectRatio', '16:9');
      referenceFormData.append('type', 'image');
      referenceFormData.append('projectId', testProject.id);
      referenceFormData.append('userId', testUser.id);

      const referenceResult = await createRenderAction(referenceFormData);
      expect(referenceResult.success).toBe(true);

      // Create render with reference
      const formData = new FormData();
      formData.append('prompt', 'Second render');
      formData.append('style', 'photorealistic');
      formData.append('quality', 'standard');
      formData.append('aspectRatio', '16:9');
      formData.append('type', 'image');
      formData.append('projectId', testProject.id);
      formData.append('referenceRenderId', referenceResult.data?.renderId || '');
      formData.append('userId', testUser.id);

      const result = await createRenderAction(formData);

      expect(result.success).toBe(true);
      expect(result.data?.renderId).toBeDefined();
    });

    it('should create video render', async () => {
      const formData = new FormData();
      formData.append('prompt', 'A beautiful video');
      formData.append('style', 'photorealistic');
      formData.append('quality', 'standard');
      formData.append('aspectRatio', '16:9');
      formData.append('type', 'video');
      formData.append('projectId', testProject.id);
      formData.append('duration', '4');
      formData.append('userId', testUser.id);

      const result = await createRenderAction(formData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

