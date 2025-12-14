/**
 * Integration tests for user renders actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getUserRenders,
  getUserRenderById,
} from '@/lib/actions/user-renders.actions';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { RendersDAL } from '@/lib/dal/renders';

vi.mock('@/lib/services/auth-cache');

describe('User Renders Actions', () => {
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

  describe('getUserRenders', () => {
    it('should get user renders', async () => {
      await RendersDAL.create({
        userId: testUser.id,
        projectId: testProject.id,
        type: 'image',
        prompt: 'Test',
        status: 'completed',
      } as any);

      const result = await getUserRenders();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter by project', async () => {
      const result = await getUserRenders(testProject.id);

      expect(result.success).toBe(true);
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getUserRenders();

      expect(result.success).toBe(false);
      expect(result.error).toContain('authenticated');
    });
  });

  describe('getUserRenderById', () => {
    it('should get render by id', async () => {
      const render = await RendersDAL.create({
        userId: testUser.id,
        projectId: testProject.id,
        type: 'image',
        prompt: 'Test',
        status: 'completed',
      } as any);

      const result = await getUserRenderById(render.id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(render.id);
    });

    it('should reject access to other user renders', async () => {
      const otherUser = await createTestUser();
      const render = await RendersDAL.create({
        userId: otherUser.id,
        projectId: testProject.id,
        type: 'image',
        prompt: 'Test',
        status: 'completed',
      } as any);

      const result = await getUserRenderById(render.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });
  });
});

