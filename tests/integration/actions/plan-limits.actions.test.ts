/**
 * Integration tests for plan limits actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getUserPlanLimits,
  checkProjectLimit,
  checkRenderLimit,
  checkQualityLimit,
  checkVideoLimit,
} from '@/lib/actions/plan-limits.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { PlanLimitsService } from '@/lib/services/plan-limits.service';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/plan-limits.service', () => ({
  PlanLimitsService: {
    getUserPlanLimits: vi.fn(),
    checkProjectLimit: vi.fn(),
    checkRenderLimit: vi.fn(),
    checkQualityLimit: vi.fn(),
    checkVideoLimit: vi.fn(),
  },
}));

describe('Plan Limits Actions', () => {
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

  describe('getUserPlanLimits', () => {
    it('should get user plan limits', async () => {
      vi.mocked(PlanLimitsService.getUserPlanLimits).mockResolvedValue({
        maxProjects: 10,
        maxRendersPerProject: 100,
      } as any);

      const result = await getUserPlanLimits();

      expect(result.success).toBe(true);
      expect(result.limits).toBeDefined();
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getUserPlanLimits();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });
  });

  describe('checkProjectLimit', () => {
    it('should check project limit', async () => {
      vi.mocked(PlanLimitsService.checkProjectLimit).mockResolvedValue({
        allowed: true,
      } as any);

      const result = await checkProjectLimit();

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe('checkRenderLimit', () => {
    it('should check render limit for project', async () => {
      vi.mocked(PlanLimitsService.checkRenderLimit).mockResolvedValue({
        allowed: true,
        remaining: 50,
      } as any);

      const result = await checkRenderLimit('project-id');

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe('checkQualityLimit', () => {
    it('should check quality limit', async () => {
      vi.mocked(PlanLimitsService.checkQualityLimit).mockResolvedValue({
        allowed: true,
      } as any);

      const result = await checkQualityLimit('high');

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe('checkVideoLimit', () => {
    it('should check video limit', async () => {
      vi.mocked(PlanLimitsService.checkVideoLimit).mockResolvedValue({
        allowed: true,
        remaining: 5,
      } as any);

      const result = await checkVideoLimit();

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });
});

