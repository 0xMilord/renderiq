/**
 * Integration tests for project rules actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getProjectRules,
  getActiveProjectRules,
  createProjectRule,
  updateProjectRule,
  deleteProjectRule,
} from '@/lib/actions/project-rules.actions';
import { setupTestDB, teardownTestDB, createTestUser, createTestProject } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { ProjectRulesDAL } from '@/lib/dal/project-rules';
import { db } from '@/lib/db';
import { renderChains, projects } from '@/lib/db/schema';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/dal/project-rules', () => ({
  ProjectRulesDAL: {
    getAllRulesByChainId: vi.fn(),
    getActiveRulesByChainId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('Project Rules Actions', () => {
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

  describe('getProjectRules', () => {
    it('should get all project rules', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                chain: { id: 'chain-id', projectId: testProject.id },
                project: testProject,
              }]),
            }),
          }),
        }),
      } as any);

      vi.mocked(ProjectRulesDAL.getAllRulesByChainId).mockResolvedValue([
        { id: 'rule-1', rule: 'Test rule' },
      ] as any);

      const result = await getProjectRules('chain-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should verify chain ownership', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      const result = await getProjectRules('non-existent-chain');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('createProjectRule', () => {
    it('should create project rule', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{
                chain: { id: 'chain-id', projectId: testProject.id },
                project: testProject,
              }]),
            }),
          }),
        }),
      } as any);

      vi.mocked(ProjectRulesDAL.create).mockResolvedValue({
        id: 'rule-1',
        rule: 'New rule',
      } as any);

      const result = await createProjectRule({
        chainId: 'chain-id',
        rule: 'New rule',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should validate rule input', async () => {
      const result = await createProjectRule({
        chainId: 'chain-id',
        rule: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateProjectRule', () => {
    it('should update project rule', async () => {
      vi.mocked(ProjectRulesDAL.update).mockResolvedValue({
        id: 'rule-1',
        rule: 'Updated rule',
      } as any);

      const result = await updateProjectRule({
        id: 'rule-1',
        rule: 'Updated rule',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('deleteProjectRule', () => {
    it('should delete project rule', async () => {
      vi.mocked(ProjectRulesDAL.delete).mockResolvedValue(undefined);

      const result = await deleteProjectRule('rule-1');

      expect(result.success).toBe(true);
    });
  });
});

