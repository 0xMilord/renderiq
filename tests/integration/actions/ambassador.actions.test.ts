/**
 * Integration tests for ambassador actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyForAmbassadorAction,
  getAmbassadorStatusAction,
  getAmbassadorDashboardAction,
} from '@/lib/actions/ambassador.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { AmbassadorService } from '@/lib/services/ambassador.service';
import { AmbassadorDAL } from '@/lib/dal/ambassador';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/services/ambassador.service', () => ({
  AmbassadorService: {
    applyForAmbassador: vi.fn(),
  },
}));

vi.mock('@/lib/dal/ambassador', () => ({
  AmbassadorDAL: {
    getAmbassadorByUserId: vi.fn(),
  },
}));

describe('Ambassador Actions', () => {
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

  describe('applyForAmbassadorAction', () => {
    it('should apply for ambassador program', async () => {
      vi.mocked(AmbassadorService.applyForAmbassador).mockResolvedValue({
        success: true,
        data: {
          id: 'ambassador-id',
          status: 'pending',
        },
      } as any);

      const result = await applyForAmbassadorAction({
        socialMediaLinks: ['https://twitter.com/user'],
        contentExamples: ['example1'],
        whyInterested: 'I love the product',
      } as any);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await applyForAmbassadorAction({
        socialMediaLinks: [],
        contentExamples: [],
        whyInterested: 'Test',
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });
  });

  describe('getAmbassadorStatusAction', () => {
    it('should get ambassador status', async () => {
      vi.mocked(AmbassadorDAL.getAmbassadorByUserId).mockResolvedValue({
        ambassador: {
          id: 'ambassador-id',
          status: 'approved',
        },
      } as any);

      const result = await getAmbassadorStatusAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return null if not ambassador', async () => {
      vi.mocked(AmbassadorDAL.getAmbassadorByUserId).mockResolvedValue(null);

      const result = await getAmbassadorStatusAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getAmbassadorDashboardAction', () => {
    it('should get ambassador dashboard data', async () => {
      vi.mocked(AmbassadorDAL.getAmbassadorByUserId).mockResolvedValue({
        ambassador: {
          id: 'ambassador-id',
          status: 'approved',
        },
        stats: {
          totalReferrals: 10,
          totalEarnings: 100,
        },
      } as any);

      const result = await getAmbassadorDashboardAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

