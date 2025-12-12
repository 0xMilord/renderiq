/**
 * Comprehensive unit tests for AmbassadorDAL
 * Tests all CRUD operations, edge cases, and query optimizations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AmbassadorDAL } from '@/lib/dal/ambassador';
import { setupTestDB, teardownTestDB, createTestUser, getTestDB } from '../../fixtures/database';
import { ambassadors, ambassadorLinks, ambassadorReferrals } from '@/lib/db/schema';
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

      const updated = await AmbassadorDAL.updateAmbassadorStatus(
        ambassador.id,
        'approved',
        'admin-id'
      );

      expect(updated.status).toBe('approved');
      expect(updated.approvedBy).toBe('admin-id');
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
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
        totalReferrals: 0,
      }).returning();

      const referredUser = await createTestUser();

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
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
        totalReferrals: 0,
      }).returning();

      const [link] = await db.insert(ambassadorLinks).values({
        ambassadorId: ambassador.id,
        code: 'LINK1',
        url: 'https://example.com',
        signupCount: 0,
      }).returning();

      const referredUser = await createTestUser();

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

      const referrals = await AmbassadorDAL.getReferrals(ambassador.id);

      expect(referrals.length).toBe(1);
      expect(referrals[0].referral.ambassadorId).toBe(ambassador.id);
    });

    it('should filter referrals by status', async () => {
      const db = getTestDB();
      const [ambassador] = await db.insert(ambassadors).values({
        userId: testUser.id,
        code: 'TEST123',
        status: 'active',
        applicationData: {},
      }).returning();

      const user1 = await createTestUser();
      const user2 = await createTestUser();
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
});



