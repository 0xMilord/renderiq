/**
 * Integration tests for tools actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getToolsAction,
  getToolBySlugAction,
  getToolExecutionsAction,
} from '@/lib/actions/tools.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { ToolsService } from '@/lib/services/tools.service';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/tools.service', () => ({
  ToolsService: {
    getActiveTools: vi.fn(),
    getToolsByCategory: vi.fn(),
    getToolsByOutputType: vi.fn(),
    getToolBySlug: vi.fn(),
    getExecutionsByUser: vi.fn(),
    getExecutionsByProject: vi.fn(),
    getExecutionsByTool: vi.fn(),
  },
}));

describe('Tools Actions', () => {
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

  describe('getToolsAction', () => {
    it('should get all active tools', async () => {
      const mockTools = [{ id: '1', name: 'Tool 1' }];
      vi.mocked(ToolsService.getActiveTools).mockResolvedValue(mockTools as any);

      const result = await getToolsAction();

      expect(result.success).toBe(true);
      expect(result.tools).toEqual(mockTools);
    });

    it('should filter by category', async () => {
      const mockTools = [{ id: '1', category: 'transformation' }];
      vi.mocked(ToolsService.getToolsByCategory).mockResolvedValue(mockTools as any);

      const result = await getToolsAction({ category: 'transformation' });

      expect(result.success).toBe(true);
      expect(ToolsService.getToolsByCategory).toHaveBeenCalledWith('transformation');
    });
  });

  describe('getToolBySlugAction', () => {
    it('should get tool by slug', async () => {
      const mockTool = { id: '1', slug: 'test-tool' };
      vi.mocked(ToolsService.getToolBySlug).mockResolvedValue(mockTool as any);

      const result = await getToolBySlugAction('test-tool');

      expect(result.success).toBe(true);
      expect(result.tool).toEqual(mockTool);
    });

    it('should return error for non-existent tool', async () => {
      vi.mocked(ToolsService.getToolBySlug).mockResolvedValue(null);

      const result = await getToolBySlugAction('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getToolExecutionsAction', () => {
    it('should get executions for user', async () => {
      const mockExecutions = [{ id: '1', toolId: 'tool-1' }];
      vi.mocked(ToolsService.getExecutionsByUser).mockResolvedValue(mockExecutions as any);

      const result = await getToolExecutionsAction();

      expect(result.success).toBe(true);
      expect(result.executions).toEqual(mockExecutions);
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getToolExecutionsAction();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });
  });
});

