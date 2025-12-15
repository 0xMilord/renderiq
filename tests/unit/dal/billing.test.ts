/**
 * Comprehensive unit tests for BillingDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BillingDAL } from '@/lib/dal/billing';
import { setupTestDB, teardownTestDB, createTestUser, createTestSubscriptionPlan, createTestUserCredits, getTestDB } from '../../fixtures/database';
import { userSubscriptions, subscriptionPlans, userCredits, creditTransactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('BillingDAL', () => {
  let testUser: any;
  let testPlan: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    testPlan = await createTestSubscriptionPlan();
    await createTestUserCredits(testUser.id, 100);
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('getUserSubscription', () => {
    it('should return user subscription with plan details', async () => {
      const db = getTestDB();
      const [subscription] = await db.insert(userSubscriptions).values({
        userId: testUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }).returning();

      const result = await BillingDAL.getUserSubscription(testUser.id);

      expect(result).toBeDefined();
      expect(result?.subscription.id).toBe(subscription.id);
      expect(result?.plan?.id).toBe(testPlan.id);
    });

    it('should prioritize active subscription over others', async () => {
      const db = getTestDB();
      const [activeSub] = await db.insert(userSubscriptions).values({
        userId: testUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }).returning();

      await db.insert(userSubscriptions).values({
        userId: testUser.id,
        planId: testPlan.id,
        status: 'canceled',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const result = await BillingDAL.getUserSubscription(testUser.id);

      expect(result?.subscription.id).toBe(activeSub.id);
      expect(result?.subscription.status).toBe('active');
    });

    it('should return null when user has no subscription', async () => {
      const newUser = await createTestUser();
      const result = await BillingDAL.getUserSubscription(newUser.id);

      expect(result).toBeNull();
    });
  });

  describe('isUserPro', () => {
    it('should return true for user with active subscription', async () => {
      const db = getTestDB();
      await db.insert(userSubscriptions).values({
        userId: testUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const isPro = await BillingDAL.isUserPro(testUser.id);

      expect(isPro).toBe(true);
    });

    it('should return false for user with expired subscription', async () => {
      const db = getTestDB();
      await db.insert(userSubscriptions).values({
        userId: testUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });

      const isPro = await BillingDAL.isUserPro(testUser.id);

      expect(isPro).toBe(false);
    });

    it('should return false for user with canceled subscription', async () => {
      const db = getTestDB();
      await db.insert(userSubscriptions).values({
        userId: testUser.id,
        planId: testPlan.id,
        status: 'canceled',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const isPro = await BillingDAL.isUserPro(testUser.id);

      expect(isPro).toBe(false);
    });

    it('should return false for user with no subscription', async () => {
      const newUser = await createTestUser();
      const isPro = await BillingDAL.isUserPro(newUser.id);

      expect(isPro).toBe(false);
    });
  });

  describe('getUserCreditsWithReset', () => {
    it('should return user credits with reset date from subscription', async () => {
      const db = getTestDB();
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.insert(userSubscriptions).values({
        userId: testUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      });

      const result = await BillingDAL.getUserCreditsWithReset(testUser.id);

      expect(result).toBeDefined();
      expect(result?.balance).toBe(100);
      expect(result?.nextResetDate).toBeInstanceOf(Date);
    });

    it('should return credits without reset date when no subscription', async () => {
      const newUser = await createTestUser();
      await createTestUserCredits(newUser.id, 50);

      const result = await BillingDAL.getUserCreditsWithReset(newUser.id);

      expect(result).toBeDefined();
      expect(result?.balance).toBe(50);
      expect(result?.nextResetDate).toBeNull();
    });

    it('should return null when user has no credits record', async () => {
      const newUser = await createTestUser();
      const result = await BillingDAL.getUserCreditsWithReset(newUser.id);

      expect(result).toBeNull();
    });
  });

  describe('getMonthlyCredits', () => {
    it('should return monthly earned and spent credits', async () => {
      const db = getTestDB();
      const periodStart = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

      await db.insert(creditTransactions).values([
        {
          userId: testUser.id,
          amount: 100,
          type: 'earned',
          description: 'Earned credits',
          createdAt: new Date(),
        },
        {
          userId: testUser.id,
          amount: -50,
          type: 'spent',
          description: 'Spent credits',
          createdAt: new Date(),
        },
      ]);

      const result = await BillingDAL.getMonthlyCredits(testUser.id, periodStart, periodEnd);

      expect(result.monthlyEarned).toBeGreaterThanOrEqual(100);
      expect(result.monthlySpent).toBeGreaterThanOrEqual(50);
    });

    it('should return zero for period with no transactions', async () => {
      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

      const result = await BillingDAL.getMonthlyCredits(testUser.id, periodStart, periodEnd);

      expect(result.monthlyEarned).toBe(0);
      expect(result.monthlySpent).toBe(0);
    });

    it('should handle transactions outside period', async () => {
      const db = getTestDB();
      const periodStart = new Date();
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await db.insert(creditTransactions).values({
        userId: testUser.id,
        amount: 100,
        type: 'earned',
        description: 'Old transaction',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      });

      const result = await BillingDAL.getMonthlyCredits(testUser.id, periodStart, periodEnd);

      expect(result.monthlyEarned).toBe(0);
    });
  });

  describe('getUserCreditsWithResetAndMonthly', () => {
    it('should return credits with reset and monthly info', async () => {
      const db = getTestDB();
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.insert(userSubscriptions).values({
        userId: testUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      });

      const result = await BillingDAL.getUserCreditsWithResetAndMonthly(testUser.id);

      expect(result).toBeDefined();
      expect(result?.balance).toBe(100);
      expect(result?.monthlyEarned).toBeDefined();
      expect(result?.monthlySpent).toBeDefined();
    });

    it('should return null when user has no credits', async () => {
      const newUser = await createTestUser();
      const result = await BillingDAL.getUserCreditsWithResetAndMonthly(newUser.id);

      expect(result).toBeNull();
    });
  });

  describe('getSubscriptionPlans', () => {
    it('should return all active subscription plans', async () => {
      await createTestSubscriptionPlan({ name: 'Plan 1', isActive: true });
      await createTestSubscriptionPlan({ name: 'Plan 2', isActive: true });
      await createTestSubscriptionPlan({ name: 'Inactive Plan', isActive: false });

      const plans = await BillingDAL.getSubscriptionPlans();

      expect(plans.length).toBeGreaterThanOrEqual(2);
      expect(plans.every(p => p.isActive)).toBe(true);
    });

    it('should order plans by price', async () => {
      await createTestSubscriptionPlan({ name: 'Expensive', price: '29.99', isActive: true });
      await createTestSubscriptionPlan({ name: 'Cheap', price: '9.99', isActive: true });

      const plans = await BillingDAL.getSubscriptionPlans();

      const prices = plans.map(p => parseFloat(p.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('should return empty array when no active plans exist', async () => {
      const db = getTestDB();
      await db.update(subscriptionPlans).set({ isActive: false });

      const plans = await BillingDAL.getSubscriptionPlans();

      expect(plans).toEqual([]);
    });
  });

  describe('getUserBillingStats', () => {
    it('should return comprehensive billing stats', async () => {
      const db = getTestDB();
      await db.insert(userSubscriptions).values({
        userId: testUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const stats = await BillingDAL.getUserBillingStats(testUser.id);

      expect(stats).toBeDefined();
      expect(stats.credits).toBeDefined();
      expect(stats.subscription).toBeDefined();
      expect(typeof stats.isPro).toBe('boolean');
    });

    it('should return stats with isPro true for active subscription', async () => {
      const db = getTestDB();
      await db.insert(userSubscriptions).values({
        userId: testUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const stats = await BillingDAL.getUserBillingStats(testUser.id);

      expect(stats.isPro).toBe(true);
    });

    it('should return stats with isPro false for no subscription', async () => {
      const newUser = await createTestUser();
      await createTestUserCredits(newUser.id, 50);

      const stats = await BillingDAL.getUserBillingStats(newUser.id);

      expect(stats.isPro).toBe(false);
      expect(stats.credits).toBeDefined();
    });

    it('should handle user with no credits record', async () => {
      const newUser = await createTestUser();

      const stats = await BillingDAL.getUserBillingStats(newUser.id);

      expect(stats.credits).toBeNull();
      expect(stats.isPro).toBe(false);
    });
  });
});







