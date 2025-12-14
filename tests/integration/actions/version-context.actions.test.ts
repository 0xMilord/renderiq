/**
 * Integration tests for version context actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parsePromptWithMentions,
  getVersionContext,
} from '@/lib/actions/version-context.actions';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { buildUnifiedContextAction } from '@/lib/actions/centralized-context.actions';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/actions/centralized-context.actions', () => ({
  buildUnifiedContextAction: vi.fn(),
}));

describe('Version Context Actions', () => {
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

  describe('parsePromptWithMentions', () => {
    it('should parse prompt with mentions', async () => {
      vi.mocked(buildUnifiedContextAction).mockResolvedValue({
        success: true,
        data: {
          versionContext: {
            parsedPrompt: {
              originalPrompt: 'Test @v1',
              userIntent: 'Test',
              mentionedVersions: ['v1'],
              hasMentions: true,
            },
          },
        } as any,
      });

      const result = await parsePromptWithMentions('Test @v1', testProject.id);

      expect(result.success).toBe(true);
      expect(result.data?.hasMentions).toBe(true);
    });

    it('should handle prompt without mentions', async () => {
      vi.mocked(buildUnifiedContextAction).mockResolvedValue({
        success: true,
        data: {} as any,
      });

      const result = await parsePromptWithMentions('Test prompt', testProject.id);

      expect(result.success).toBe(true);
      expect(result.data?.hasMentions).toBe(false);
    });
  });

  describe('getVersionContext', () => {
    it('should get version context for render', async () => {
      vi.mocked(buildUnifiedContextAction).mockResolvedValue({
        success: true,
        data: {
          referenceRender: {
            id: 'render-123',
            prompt: 'Test',
            settings: {},
            outputUrl: 'https://example.com/image.jpg',
            type: 'image',
            createdAt: new Date(),
          },
        } as any,
      });

      const result = await getVersionContext('render-123');

      expect(result.success).toBe(true);
      expect(result.data?.renderId).toBe('render-123');
    });
  });
});

