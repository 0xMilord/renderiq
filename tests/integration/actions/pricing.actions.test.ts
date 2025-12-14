/**
 * Integration tests for pricing actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCreditPackagesAction,
  getSubscriptionPlansAction,
  getUserCreditsAction,
} from '@/lib/actions/pricing.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { db } from '@/lib/db';
import { BillingDAL } from '@/lib/dal/billing';

vi.mock('@/lib/services/auth-cache');
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/dal/billing', () => ({
  BillingDAL: {
    getUserCreditsWithReset: vi.fn(),
  },
}));

describe('Pricing Actions', () => {
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

  describe('getCreditPackagesAction', () => {
    it('should get active credit packages', async () => {
      const mockPackages = [
        { id: 'pkg-1', name: 'Starter', price: '100', isActive: true },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockPackages),
          }),
        }),
      } as any);

      const result = await getCreditPackagesAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getSubscriptionPlansAction', () => {
    it('should get active subscription plans', async () => {
      const mockPlans = [
        { id: 'plan-1', name: 'Pro', price: '999', isActive: true },
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockPlans),
          }),
        }),
      } as any);

      const result = await getSubscriptionPlansAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getUserCreditsAction', () => {
    it('should get user credits', async () => {
      vi.mocked(BillingDAL.getUserCreditsWithReset).mockResolvedValue({
        balance: 1000,
        totalEarned: 2000,
        totalSpent: 1000,
      } as any);

      const result = await getUserCreditsAction();

      expect(result.success).toBe(true);
      expect(result.data?.balance).toBe(1000);
    });

    it('should return zero credits if none found', async () => {
      vi.mocked(BillingDAL.getUserCreditsWithReset).mockResolvedValue(null);

      const result = await getUserCreditsAction();

      expect(result.success).toBe(true);
      expect(result.data?.balance).toBe(0);
    });

    it('should require authentication', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getUserCreditsAction();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication');
    });
  });
});

