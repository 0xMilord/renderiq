/**
 * Integration tests for billing actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getUserCredits,
  getUserSubscriptionAction,
  isUserProAction,
  addCredits,
  deductCredits,
} from '@/lib/actions/billing.actions';
import { setupTestDB, teardownTestDB, createTestUser } from '../../fixtures/database';
import { getCachedUser } from '@/lib/services/auth-cache';
import { BillingDAL } from '@/lib/dal/billing';

// Mock auth cache
vi.mock('@/lib/services/auth-cache');

describe('Billing Actions', () => {
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

  describe('getUserCredits', () => {
    it('should return user credits', async () => {
      // Mock credits
      vi.spyOn(BillingDAL, 'getUserCreditsWithResetAndMonthly').mockResolvedValue({
        id: 'credits-123',
        userId: testUser.id,
        balance: 1000,
        totalEarned: 2000,
        totalSpent: 1000,
        monthlyEarned: 500,
        monthlySpent: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await getUserCredits();

      expect(result.success).toBe(true);
      expect(result.credits).toBeDefined();
      expect(result.credits?.balance).toBe(1000);
      expect(result.credits?.totalEarned).toBe(2000);
    });

    it('should reject unauthenticated requests', async () => {
      vi.mocked(getCachedUser).mockResolvedValue({
        user: null,
        fromCache: false,
      });

      const result = await getUserCredits();

      expect(result.success).toBe(false);
      expect(result.error).toContain('authenticated');
    });
  });

  describe('getUserSubscriptionAction', () => {
    it('should return subscription if exists', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: testUser.id,
        planId: 'pro',
        status: 'active',
      };

      vi.spyOn(BillingDAL, 'getUserSubscription').mockResolvedValue(mockSubscription as any);

      const result = await getUserSubscriptionAction(testUser.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.planId).toBe('pro');
    });

    it('should return null if no subscription', async () => {
      vi.spyOn(BillingDAL, 'getUserSubscription').mockResolvedValue(null);

      const result = await getUserSubscriptionAction(testUser.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('isUserProAction', () => {
    it('should return true for pro users', async () => {
      vi.spyOn(BillingDAL, 'isUserPro').mockResolvedValue(true);

      const result = await isUserProAction(testUser.id);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for free users', async () => {
      vi.spyOn(BillingDAL, 'isUserPro').mockResolvedValue(false);

      const result = await isUserProAction(testUser.id);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('addCredits', () => {
    it('should add credits to user', async () => {
      vi.spyOn(BillingDAL, 'addCredits').mockResolvedValue(undefined);

      const result = await addCredits(testUser.id, 100, 'Test bonus');

      expect(result.success).toBe(true);
      expect(BillingDAL.addCredits).toHaveBeenCalledWith(testUser.id, 100, 'Test bonus');
    });

    it('should handle errors', async () => {
      vi.spyOn(BillingDAL, 'addCredits').mockRejectedValue(new Error('Database error'));

      const result = await addCredits(testUser.id, 100, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deductCredits', () => {
    it('should deduct credits from user', async () => {
      vi.spyOn(BillingDAL, 'deductCredits').mockResolvedValue(true);

      const result = await deductCredits(testUser.id, 50, 'Render generation');

      expect(result.success).toBe(true);
      expect(BillingDAL.deductCredits).toHaveBeenCalledWith(testUser.id, 50, 'Render generation');
    });

    it('should handle insufficient credits', async () => {
      vi.spyOn(BillingDAL, 'deductCredits').mockResolvedValue(false);

      const result = await deductCredits(testUser.id, 50, 'Render generation');

      expect(result.success).toBe(false);
      expect(result.error).toContain('insufficient');
    });
  });
});

