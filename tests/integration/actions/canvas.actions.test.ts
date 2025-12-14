/**
 * Integration tests for canvas actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveCanvasStateAction,
  loadCanvasStateAction,
  loadChainCanvasStateAction,
} from '@/lib/actions/canvas.actions';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { RendersDAL } from '@/lib/dal/renders';
import { canvasService } from '@/lib/services/canvas.service';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/canvas.service', () => ({
  canvasService: {
    saveCanvasState: vi.fn(),
    loadCanvasState: vi.fn(),
    getChainCanvasState: vi.fn(),
  },
}));

describe('Canvas Actions', () => {
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

  describe('saveCanvasStateAction', () => {
    it('should save canvas state', async () => {
      const render = await RendersDAL.create({
        userId: testUser.id,
        projectId: testProject.id,
        type: 'image',
        prompt: 'Test',
        status: 'completed',
      } as any);

      const canvasState = {
        version: '1.0.0',
        canvasData: {},
      };

      const result = await saveCanvasStateAction(render.id, canvasState);

      expect(result.success).toBe(true);
      expect(canvasService.saveCanvasState).toHaveBeenCalledWith(render.id, canvasState);
    });

    it('should reject unauthenticated requests', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await saveCanvasStateAction('render-123', { version: '1.0.0' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should reject unauthorized access', async () => {
      const otherUser = await createTestUser();
      const render = await RendersDAL.create({
        userId: otherUser.id,
        projectId: testProject.id,
        type: 'image',
        prompt: 'Test',
        status: 'completed',
      } as any);

      const result = await saveCanvasStateAction(render.id, { version: '1.0.0' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('unauthorized');
    });
  });

  describe('loadCanvasStateAction', () => {
    it('should load canvas state', async () => {
      const render = await RendersDAL.create({
        userId: testUser.id,
        projectId: testProject.id,
        type: 'image',
        prompt: 'Test',
        status: 'completed',
      } as any);

      const mockCanvasState = { version: '1.0.0', canvasData: {} };
      vi.mocked(canvasService.loadCanvasState).mockResolvedValue(mockCanvasState as any);

      const result = await loadCanvasStateAction(render.id);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCanvasState);
    });
  });
});

