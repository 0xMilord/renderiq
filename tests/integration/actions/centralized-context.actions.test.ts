/**
 * Integration tests for centralized context actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildUnifiedContextAction,
  getFinalPromptAction,
  getReferenceRenderIdAction,
} from '@/lib/actions/centralized-context.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { CentralizedContextService } from '@/lib/services/centralized-context-service';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/centralized-context-service', () => ({
  CentralizedContextService: {
    buildUnifiedContext: vi.fn(),
    getFinalPrompt: vi.fn(),
    getReferenceRenderId: vi.fn(),
  },
}));

describe('Centralized Context Actions', () => {
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

  describe('buildUnifiedContextAction', () => {
    it('should build unified context', async () => {
      const mockContext = {
        contextualPrompt: 'Enhanced prompt',
        versionContext: {},
        pipelineMemory: {},
      };

      vi.mocked(CentralizedContextService.buildUnifiedContext).mockResolvedValue(mockContext as any);

      const result = await buildUnifiedContextAction({
        projectId: 'project-id',
        chainId: 'chain-id',
        prompt: 'A house',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await buildUnifiedContextAction({
        projectId: 'project-id',
        prompt: 'A house',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not authenticated');
    });
  });

  describe('getFinalPromptAction', () => {
    it('should get final prompt from context', async () => {
      const mockContext = {
        contextualPrompt: 'Enhanced prompt',
        versionContext: {},
        pipelineMemory: {},
      };

      vi.mocked(CentralizedContextService.getFinalPrompt).mockReturnValue('Final enhanced prompt');

      const result = await getFinalPromptAction(mockContext as any, 'Original prompt');

      expect(result.success).toBe(true);
      expect(result.data).toBe('Final enhanced prompt');
    });
  });

  describe('getReferenceRenderIdAction', () => {
    it('should get reference render ID', async () => {
      const mockContext = {
        contextualPrompt: 'Enhanced prompt',
        versionContext: {},
        pipelineMemory: {},
      };

      vi.mocked(CentralizedContextService.getReferenceRenderId).mockReturnValue('render-123');

      const result = await getReferenceRenderIdAction(mockContext as any);

      expect(result.success).toBe(true);
      expect(result.data).toBe('render-123');
    });
  });
});

