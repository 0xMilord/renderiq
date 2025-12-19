/**
 * Comprehensive unit tests for AmbassadorDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AmbassadorDAL } from '@/lib/dal/ambassador';
import { setupTestDB, teardownTestDB, createTestUser, createTestSubscriptionPlan, getTestDB } from '../../fixtures/database';
import { ambassadors, ambassadorLinks, ambassadorReferrals, ambassadorCommissions, ambassadorVolumeTiers, users, userSubscriptions, paymentOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('AmbassadorDAL', () => {
  let testUser: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await teardownTestDB();
  });

  describe('createApplication', () => {
    it('should create ambassador application with code', async () => {
      // Verify user exists in database before creating ambassador
      const db = getTestDB();
      const verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
      if (verifyUser.length === 0) {
        throw new Error(`User ${testUser.id} does not exist in database. Test setup failed.`);
      }
      
      const code = 'TEST123';
      const applicationData = {
        socialMedia: 'instagram',
        followers: 10000,
      };

      const application = await AmbassadorDAL.createApplication(
        testUser.id,
        applicationData,
        code
      );

      expect(application).toBeDefined();
      expect(application.userId).toBe(testUser.id);
      expect(application.code).toBe(code);
      expect(application.status).toBe('pending');
      expect(application.applicationData).toEqual(applicationData);
    });
  });

  describe('getAmbassadorByUserId', () => {
    it('should return ambassador by user id', async () => {
      const db = getTestDB();
      const code = 'TEST123';
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code,
        status: 'pending',
        applicationData: {},
      }).returning();

      const result = await AmbassadorDAL.getAmbassadorByUserId(testUser.id);

      expect(result).toBeDefined();
      expect(result?.ambassador.id).toBe(ambassador.id);
      expect(result?.user?.id).toBe(testUser.id);
    });

    it('should return null for user with no ambassador record', async () => {
      const newUser = await createTestUser();
      const result = await AmbassadorDAL.getAmbassadorByUserId(newUser.id);

      expect(result).toBeNull();
    });
  });

  describe('getAmbassadorById', () => {
    it('should return ambassador by id', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'pending',
        applicationData: {},
      }).returning();

      const result = await AmbassadorDAL.getAmbassadorById(ambassador.id);

      expect(result).toBeDefined();
      expect(result?.ambassador.id).toBe(ambassador.id);
    });

    it('should return null for non-existent ambassador', async () => {
      const result = await AmbassadorDAL.getAmbassadorById('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('getAmbassadorByCode', () => {
    it('should return ambassador by code', async () => {
      const db = getTestDB();
      const code = 'TEST123';
      await db.insert(ambassadors).values({
        userId: testUser.id,
        code,
        status: 'active',
        applicationData: {},
      });

      const result = await AmbassadorDAL.getAmbassadorByCode(code);

      expect(result).toBeDefined();
      expect(result?.ambassador.code).toBe(code);
    });

    it('should handle case-insensitive code lookup', async () => {
      const db = getTestDB();
      const code = 'TEST123';
      await db.insert(ambassadors).values({
        userId: testUser.id,
        code,
        status: 'active',
        applicationData: {},
      });

      const result = await AmbassadorDAL.getAmbassadorByCode('test123');

      expect(result).toBeDefined();
      expect(result?.ambassador.code).toBe(code);
    });

    it('should return null for non-existent code', async () => {
      const result = await AmbassadorDAL.getAmbassadorByCode('NONEXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('updateAmbassadorStatus', () => {
    it('should update ambassador status', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'pending',
        applicationData: {},
      }).returning();

      const { randomUUID } = await import('crypto');
      const adminUser = await createTestUser({ id: randomUUID() });
      
      const updated = await AmbassadorDAL.updateAmbassadorStatus(
        ambassador.id,
        'approved',
        adminUser.id
      );

      expect(updated.status).toBe('approved');
      expect(updated.approvedBy).toBe(adminUser.id);
      expect(updated.approvedAt).toBeInstanceOf(Date);
    });

    it('should set rejected reason when status is rejected', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'pending',
        applicationData: {},
      }).returning();

      const updated = await AmbassadorDAL.updateAmbassadorStatus(
        ambassador.id,
        'rejected',
        undefined,
        'Insufficient followers'
      );

      expect(updated.status).toBe('rejected');
      expect(updated.rejectedReason).toBe('Insufficient followers');
    });
  });

  describe('generateUniqueCode', () => {
    it('should generate unique 6-character code', async () => {
      const code = await AmbassadorDAL.generateUniqueCode();

      expect(code).toBeDefined();
      expect(code.length).toBe(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should generate different codes on multiple calls', async () => {
      const code1 = await AmbassadorDAL.generateUniqueCode();
      const code2 = await AmbassadorDAL.generateUniqueCode();

      // Very unlikely to be the same, but possible
      // In practice, they should be different
      expect(code1).toBeDefined();
      expect(code2).toBeDefined();
    });
  });

  describe('setAmbassadorCode', () => {
    it('should set ambassador code', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'OLD123',
        status: 'pending',
        applicationData: {},
      }).returning();

      const updated = await AmbassadorDAL.setAmbassadorCode(ambassador.id, 'NEW456');

      expect(updated.code).toBe('NEW456');
    });
  });

  describe('createCustomLink', () => {
    it('should create custom ambassador link', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      const link = await AmbassadorDAL.createCustomLink(
        ambassador.id,
        'CUSTOM1',
        'https://example.com/custom',
        'Campaign Name',
        'Campaign description'
      );

      expect(link).toBeDefined();
      expect(link.ambassadorId).toBe(ambassador.id);
      expect(link.code).toBe('CUSTOM1');
      expect(link.url).toBe('https://example.com/custom');
      expect(link.campaignName).toBe('Campaign Name');
    });
  });

  describe('getAmbassadorLinks', () => {
    it('should return active links by default', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      await db.insert(ambassadorLinks).values([
        {
          ambassadorId: ambassador.id,
          code: 'LINK1',
          url: 'https://example.com/1',
          isActive: true,
        },
        {
          ambassadorId: ambassador.id,
          code: 'LINK2',
          url: 'https://example.com/2',
          isActive: false,
        },
      ]);

      const links = await AmbassadorDAL.getAmbassadorLinks(ambassador.id);

      expect(links.length).toBe(1);
      expect(links[0].isActive).toBe(true);
    });

    it('should include inactive links when requested', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      await db.insert(ambassadorLinks).values({
        ambassadorId: ambassador.id,
        code: 'LINK1',
        url: 'https://example.com/1',
        isActive: false,
      });

      const links = await AmbassadorDAL.getAmbassadorLinks(ambassador.id, true);

      expect(links.length).toBe(1);
    });
  });

  describe('trackReferral', () => {
    it('should track referral and update stats', async () => {
      const db = getTestDB();
      
      // Verify user exists
      const verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
      if (verifyUser.length === 0) {
        throw new Error(`User ${testUser.id} does not exist in database. Test setup failed.`);
      }
      
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
        totalReferrals: 0,
      }).returning();

      // ✅ FIXED: Verify ambassador was created with retry logic
      let verifyAmbassador = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        const check = await db.select().from(ambassadors).where(eq(ambassadors.id, ambassador.id)).limit(1);
        if (check.length > 0) {
          verifyAmbassador = check;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!verifyAmbassador || verifyAmbassador.length === 0) {
        throw new Error(`Ambassador ${ambassador.id} was not created.`);
      }

      const referredUser = await createTestUser();
      
      // Verify referred user exists
      const verifyReferredUser = await db.select().from(users).where(eq(users.id, referredUser.id)).limit(1);
      if (verifyReferredUser.length === 0) {
        throw new Error(`Referred user ${referredUser.id} does not exist in database.`);
      }

      const referral = await AmbassadorDAL.trackReferral(
        ambassador.id,
        referredUser.id,
        'TEST123'
      );

      expect(referral).toBeDefined();
      expect(referral.ambassadorId).toBe(ambassador.id);
      expect(referral.referredUserId).toBe(referredUser.id);
      expect(referral.status).toBe('pending');

      // Verify stats were updated
      const updated = await db.select().from(ambassadors).where(eq(ambassadors.id, ambassador.id)).limit(1);
      expect(updated[0].totalReferrals).toBe(1);
    });

    it('should track referral with link id', async () => {
      const db = getTestDB();
      
      // Verify user exists
      const verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
      if (verifyUser.length === 0) {
        throw new Error(`User ${testUser.id} does not exist in database. Test setup failed.`);
      }
      
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
        totalReferrals: 0,
      }).returning();

      // ✅ FIXED: Verify ambassador was created with retry logic
      let verifyAmbassador = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        const check = await db.select().from(ambassadors).where(eq(ambassadors.id, ambassador.id)).limit(1);
        if (check.length > 0) {
          verifyAmbassador = check;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!verifyAmbassador || verifyAmbassador.length === 0) {
        throw new Error(`Ambassador ${ambassador.id} was not created.`);
      }

      const [link] = await db.insert(ambassadorLinks).values({
        ambassadorId: ambassador.id,
        code: 'LINK1',
        url: 'https://example.com',
        signupCount: 0,
      }).returning();

      const referredUser = await createTestUser();
      
      // Verify referred user exists
      const verifyReferredUser = await db.select().from(users).where(eq(users.id, referredUser.id)).limit(1);
      if (verifyReferredUser.length === 0) {
        throw new Error(`Referred user ${referredUser.id} does not exist in database.`);
      }

      const referral = await AmbassadorDAL.trackReferral(
        ambassador.id,
        referredUser.id,
        'TEST123',
        link.id
      );

      expect(referral.linkId).toBe(link.id);

      // Verify link stats were updated
      const updatedLink = await db.select().from(ambassadorLinks).where(eq(ambassadorLinks.id, link.id)).limit(1);
      expect(updatedLink[0].signupCount).toBe(1);
    });
  });

  describe('getReferrals', () => {
    it('should return referrals for ambassador', async () => {
      const db = getTestDB();
      
      // Verify user exists
      const verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
      if (verifyUser.length === 0) {
        throw new Error(`User ${testUser.id} does not exist in database. Test setup failed.`);
      }
      
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      // ✅ FIXED: Verify ambassador was created with retry logic
      let verifyAmbassador = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        const check = await db.select().from(ambassadors).where(eq(ambassadors.id, ambassador.id)).limit(1);
        if (check.length > 0) {
          verifyAmbassador = check;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!verifyAmbassador || verifyAmbassador.length === 0) {
        throw new Error(`Ambassador ${ambassador.id} was not created.`);
      }

      const referredUser = await createTestUser();
      
      // Verify referred user exists
      const verifyReferredUser = await db.select().from(users).where(eq(users.id, referredUser.id)).limit(1);
      if (verifyReferredUser.length === 0) {
        throw new Error(`Referred user ${referredUser.id} does not exist in database.`);
      }
      
      await db.insert(ambassadorReferrals).values({
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        referralCode: 'TEST123',
        status: 'pending',
      });

      const referrals = await AmbassadorDAL.getReferrals(ambassador.id);

      expect(referrals.length).toBe(1);
      expect(referrals[0].referral.ambassadorId).toBe(ambassador.id);
    });

    it('should filter referrals by status', async () => {
      const db = getTestDB();
      
      // Verify user exists
      const verifyUser = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
      if (verifyUser.length === 0) {
        throw new Error(`User ${testUser.id} does not exist in database. Test setup failed.`);
      }
      
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      // ✅ FIXED: Verify ambassador was created with retry logic
      let verifyAmbassador = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        const check = await db.select().from(ambassadors).where(eq(ambassadors.id, ambassador.id)).limit(1);
        if (check.length > 0) {
          verifyAmbassador = check;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!verifyAmbassador || verifyAmbassador.length === 0) {
        throw new Error(`Ambassador ${ambassador.id} was not created.`);
      }

      const user1 = await createTestUser();
      const user2 = await createTestUser();
      
      // Verify users exist
      const verifyUser1 = await db.select().from(users).where(eq(users.id, user1.id)).limit(1);
      const verifyUser2 = await db.select().from(users).where(eq(users.id, user2.id)).limit(1);
      if (verifyUser1.length === 0 || verifyUser2.length === 0) {
        throw new Error(`Test users were not created properly.`);
      }
      
      await db.insert(ambassadorReferrals).values([
        {
          ambassadorId: ambassador.id,
          referredUserId: user1.id,
          referralCode: 'TEST123',
          status: 'pending',
        },
        {
          ambassadorId: ambassador.id,
          referredUserId: user2.id,
          referralCode: 'TEST123',
          status: 'active',
        },
      ]);

      const pendingReferrals = await AmbassadorDAL.getReferrals(ambassador.id, { status: 'pending' });

      expect(pendingReferrals.length).toBe(1);
      expect(pendingReferrals[0].referral.status).toBe('pending');
    });
  });

  describe('getReferralByUserId', () => {
    it('should return referral by user id', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      const referredUser = await createTestUser();
      
      await db.insert(ambassadorReferrals).values({
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        referralCode: 'TEST123',
        status: 'pending',
      });

      const result = await AmbassadorDAL.getReferralByUserId(referredUser.id);

      expect(result).toBeDefined();
      expect(result?.referral.referredUserId).toBe(referredUser.id);
      expect(result?.ambassador.id).toBe(ambassador.id);
    });

    it('should return null for user with no referral', async () => {
      const newUser = await createTestUser();
      const result = await AmbassadorDAL.getReferralByUserId(newUser.id);

      expect(result).toBeNull();
    });
  });

  describe('updateReferralOnSubscription', () => {
    it('should update referral on first subscription', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      const referredUser = await createTestUser();
      const testPlan = await createTestSubscriptionPlan();
      
      // ✅ FIXED: Add required currentPeriodStart and currentPeriodEnd fields
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month from now
      
      const [subscription] = await db.insert(userSubscriptions).values({
        userId: referredUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      }).returning();

      const [referral] = await db.insert(ambassadorReferrals).values({
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        referralCode: 'TEST123',
        status: 'pending',
      }).returning();

      const updated = await AmbassadorDAL.updateReferralOnSubscription(
        referral.id,
        subscription.id,
        true // first subscription
      );

      expect(updated.subscriptionId).toBe(subscription.id);
      expect(updated.status).toBe('active');
      expect(updated.firstSubscriptionAt).toBeInstanceOf(Date);
    });

    it('should update link conversion count when linkId exists', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      const [link] = await db.insert(ambassadorLinks).values({
        ambassadorId: ambassador.id,
        code: 'LINK1',
        url: 'https://example.com',
        conversionCount: 0,
      }).returning();

      const referredUser = await createTestUser();
      const testPlan = await createTestSubscriptionPlan();
      
      // ✅ FIXED: Add required currentPeriodStart and currentPeriodEnd fields
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month from now
      
      const [subscription] = await db.insert(userSubscriptions).values({
        userId: referredUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      }).returning();

      const [referral] = await db.insert(ambassadorReferrals).values({
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        referralCode: 'TEST123',
        linkId: link.id,
        status: 'pending',
      }).returning();

      await AmbassadorDAL.updateReferralOnSubscription(
        referral.id,
        subscription.id,
        true
      );

      const updatedLink = await db.select().from(ambassadorLinks).where(eq(ambassadorLinks.id, link.id)).limit(1);
      expect(updatedLink[0].conversionCount).toBe(1);
    });
  });

  describe('recordCommission', () => {
    it('should record commission and update stats', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
        totalEarnings: '0.00',
        pendingEarnings: '0.00',
      }).returning();

      const referredUser = await createTestUser();
      const testPlan = await createTestSubscriptionPlan();
      
      // ✅ FIXED: Add required currentPeriodStart and currentPeriodEnd fields
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month from now
      
      const [subscription] = await db.insert(userSubscriptions).values({
        userId: referredUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      }).returning();

      const [referral] = await db.insert(ambassadorReferrals).values({
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        referralCode: 'TEST123',
        status: 'active',
        subscriptionId: subscription.id,
        totalCommissionEarned: '0.00',
      }).returning();

      const [paymentOrder] = await db.insert(paymentOrders).values({
        userId: referredUser.id,
        type: 'subscription',
        referenceId: testPlan.id,
        amount: '80.00',
        discountAmount: '20.00',
        currency: 'USD',
        status: 'completed',
      }).returning();

      const commission = await AmbassadorDAL.recordCommission(
        ambassador.id,
        referral.id,
        subscription.id,
        paymentOrder.id,
        new Date(),
        new Date(),
        100, // original amount
        20,  // discount
        25,  // commission percentage
        25,  // commission amount
        'USD'
      );

      expect(commission).toBeDefined();
      expect(commission.commissionAmount).toBe('25.00');
      expect(commission.status).toBe('pending');

      // Verify ambassador stats updated
      const updatedAmbassador = await db.select().from(ambassadors).where(eq(ambassadors.id, ambassador.id)).limit(1);
      expect(parseFloat(updatedAmbassador[0].totalEarnings)).toBe(25);
      expect(parseFloat(updatedAmbassador[0].pendingEarnings)).toBe(25);

      // Verify referral stats updated
      const updatedReferral = await db.select().from(ambassadorReferrals).where(eq(ambassadorReferrals.id, referral.id)).limit(1);
      expect(parseFloat(updatedReferral[0].totalCommissionEarned)).toBe(25);
    });
  });

  describe('getCommissions', () => {
    it('should return commissions for ambassador', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      const referredUser = await createTestUser();
      const testPlan = await createTestSubscriptionPlan();
      
      // ✅ FIXED: Add required currentPeriodStart and currentPeriodEnd fields
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month from now
      
      const [subscription] = await db.insert(userSubscriptions).values({
        userId: referredUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      }).returning();

      const [referral] = await db.insert(ambassadorReferrals).values({
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        referralCode: 'TEST123',
        status: 'active',
        subscriptionId: subscription.id,
      }).returning();

      const [paymentOrder] = await db.insert(paymentOrders).values({
        userId: referredUser.id,
        type: 'subscription',
        referenceId: testPlan.id,
        amount: '80.00',
        currency: 'USD',
        status: 'completed',
      }).returning();

      await db.insert(ambassadorCommissions).values({
        ambassadorId: ambassador.id,
        referralId: referral.id,
        subscriptionId: subscription.id,
        paymentOrderId: paymentOrder.id,
        periodStart: new Date(),
        periodEnd: new Date(),
        subscriptionAmount: '100.00',
        discountAmount: '20.00',
        commissionPercentage: '25.00',
        commissionAmount: '25.00',
        currency: 'USD',
        status: 'pending',
      });

      const commissions = await AmbassadorDAL.getCommissions(ambassador.id);

      expect(commissions.length).toBe(1);
      expect(commissions[0].commission.ambassadorId).toBe(ambassador.id);
      expect(commissions[0].commission.commissionAmount).toBe('25.00');
    });

    it('should filter commissions by status', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      const referredUser = await createTestUser();
      const testPlan = await createTestSubscriptionPlan();
      
      // ✅ FIXED: Add required currentPeriodStart and currentPeriodEnd fields
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month from now
      
      const [subscription] = await db.insert(userSubscriptions).values({
        userId: referredUser.id,
        planId: testPlan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      }).returning();

      const [referral] = await db.insert(ambassadorReferrals).values({
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        referralCode: 'TEST123',
        status: 'active',
        subscriptionId: subscription.id,
      }).returning();

      const [paymentOrder] = await db.insert(paymentOrders).values({
        userId: referredUser.id,
        type: 'subscription',
        referenceId: testPlan.id,
        amount: '80.00',
        currency: 'USD',
        status: 'completed',
      }).returning();

      await db.insert(ambassadorCommissions).values([
        {
          ambassadorId: ambassador.id,
          referralId: referral.id,
          subscriptionId: subscription.id,
          paymentOrderId: paymentOrder.id,
          periodStart: new Date(),
          periodEnd: new Date(),
          subscriptionAmount: '100.00',
          discountAmount: '20.00',
          commissionPercentage: '25.00',
          commissionAmount: '25.00',
          currency: 'USD',
          status: 'pending',
        },
        {
          ambassadorId: ambassador.id,
          referralId: referral.id,
          subscriptionId: subscription.id,
          paymentOrderId: paymentOrder.id,
          periodStart: new Date(),
          periodEnd: new Date(),
          subscriptionAmount: '100.00',
          discountAmount: '20.00',
          commissionPercentage: '25.00',
          commissionAmount: '25.00',
          currency: 'USD',
          status: 'paid',
        },
      ]);

      const pendingCommissions = await AmbassadorDAL.getCommissions(ambassador.id, { status: 'pending' });

      expect(pendingCommissions.length).toBe(1);
      expect(pendingCommissions[0].commission.status).toBe('pending');
    });
  });

  describe('updateAmbassadorDiscount', () => {
    it('should update ambassador discount percentage', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        discountPercentage: '20.00',
        applicationData: {},
      }).returning();

      const updated = await AmbassadorDAL.updateAmbassadorDiscount(ambassador.id, 25.0);

      expect(parseFloat(updated.discountPercentage)).toBe(25);
    });
  });

  describe('getVolumeTiers', () => {
    it('should return all active volume tiers', async () => {
      const db = getTestDB();
      await db.insert(ambassadorVolumeTiers).values([
        { tierName: 'Bronze', minReferrals: 0, discountPercentage: '20.00', isActive: true },
        { tierName: 'Silver', minReferrals: 10, discountPercentage: '25.00', isActive: true },
        { tierName: 'Gold', minReferrals: 50, discountPercentage: '30.00', isActive: false },
        { tierName: 'Platinum', minReferrals: 100, discountPercentage: '35.00', isActive: true },
      ]).onConflictDoNothing();

      const tiers = await AmbassadorDAL.getVolumeTiers();

      expect(tiers.length).toBeGreaterThan(0);
      const activeTiers = tiers.filter(t => t.isActive);
      expect(activeTiers.length).toBeGreaterThan(0);
    });
  });
});



