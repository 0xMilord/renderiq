/**
 * Integration tests for analytics actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAnalyticsDataAction, getRenderStatsAction } from '@/lib/actions/analytics.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { AnalyticsService } from '@/lib/services/analytics-service';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/analytics-service', () => ({
  AnalyticsService: {
    getRenderStats: vi.fn(),
    getCreditStats: vi.fn(),
    getApiUsageStats: vi.fn(),
    getUserActivityStats: vi.fn(),
    getDailyUsage: vi.fn(),
  },
}));

describe('Analytics Actions', () => {
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

  describe('getAnalyticsDataAction', () => {
    it('should get comprehensive analytics data', async () => {
      vi.mocked(AnalyticsService.getRenderStats).mockResolvedValue({
        totalRenders: 10,
        completedRenders: 8,
      } as any);
      vi.mocked(AnalyticsService.getCreditStats).mockResolvedValue({
        totalSpent: 100,
        totalEarned: 200,
      } as any);
      vi.mocked(AnalyticsService.getApiUsageStats).mockResolvedValue({
        apiCalls: 50,
      } as any);
      vi.mocked(AnalyticsService.getUserActivityStats).mockResolvedValue({
        activeDays: 5,
      } as any);
      vi.mocked(AnalyticsService.getDailyUsage).mockResolvedValue([]);

      const result = await getAnalyticsDataAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.renderStats).toBeDefined();
      expect(result.data?.creditStats).toBeDefined();
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getAnalyticsDataAction();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should support date range filters', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      vi.mocked(AnalyticsService.getRenderStats).mockResolvedValue({} as any);
      vi.mocked(AnalyticsService.getCreditStats).mockResolvedValue({} as any);
      vi.mocked(AnalyticsService.getApiUsageStats).mockResolvedValue({} as any);
      vi.mocked(AnalyticsService.getUserActivityStats).mockResolvedValue({} as any);
      vi.mocked(AnalyticsService.getDailyUsage).mockResolvedValue([]);

      await getAnalyticsDataAction({ startDate, endDate });

      expect(AnalyticsService.getRenderStats).toHaveBeenCalledWith(
        testUser.id,
        { startDate, endDate }
      );
    });
  });

  describe('getRenderStatsAction', () => {
    it('should get render statistics', async () => {
      vi.mocked(AnalyticsService.getRenderStats).mockResolvedValue({
        totalRenders: 10,
        completedRenders: 8,
      } as any);

      const result = await getRenderStatsAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

