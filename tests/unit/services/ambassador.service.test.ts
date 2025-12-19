/**
 * Comprehensive unit tests for AmbassadorService
 * Tests all business logic, discount calculation, volume tiers, and commission processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AmbassadorService } from '@/lib/services/ambassador.service';
import { AmbassadorDAL } from '@/lib/dal/ambassador';
import { setupTestDB, teardownTestDB, createTestUser, createTestSubscriptionPlan, getTestDB } from '../../fixtures/database';
import { ambassadors, ambassadorReferrals, ambassadorVolumeTiers, userSubscriptions, paymentOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Mock AmbassadorDAL methods that are tested separately
vi.mock('@/lib/dal/ambassador', () => ({
  AmbassadorDAL: {
    getAmbassadorByCode: vi.fn(),
    getReferralByUserId: vi.fn(),
    trackReferral: vi.fn(),
    getReferrals: vi.fn(),
    recordCommission: vi.fn(),
    updateReferralOnSubscription: vi.fn(),
    getVolumeTiers: vi.fn(),
    updateAmbassadorDiscount: vi.fn(),
    getAmbassadorById: vi.fn(),
  },
}));

describe('AmbassadorService', () => {
  let testUser: any;
  let referredUser: any;
  let testPlan: any;

  beforeEach(async () => {
    await setupTestDB();
    testUser = await createTestUser();
    referredUser = await createTestUser();
    testPlan = await createTestSubscriptionPlan({ price: '100.00' });
    
    // Setup default volume tiers
    const db = getTestDB();
    await db.insert(ambassadorVolumeTiers).values([
      { tierName: 'Bronze', minReferrals: 0, discountPercentage: '20.00', isActive: true },
      { tierName: 'Silver', minReferrals: 10, discountPercentage: '25.00', isActive: true },
      { tierName: 'Gold', minReferrals: 50, discountPercentage: '30.00', isActive: true },
      { tierName: 'Platinum', minReferrals: 100, discountPercentage: '35.00', isActive: true },
    ]).onConflictDoNothing();
  });

  afterEach(async () => {
    await teardownTestDB();
    vi.clearAllMocks();
  });

  describe('trackSignup', () => {
    it('should track signup with valid referral code', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'active',
        discountPercentage: '20.00',
      };

      vi.mocked(AmbassadorDAL.getAmbassadorByCode).mockResolvedValue({
        ambassador: ambassador as any,
        user: testUser,
      });

      vi.mocked(AmbassadorDAL.getReferralByUserId).mockResolvedValue(null);
      vi.mocked(AmbassadorDAL.getAmbassadorLinks).mockResolvedValue([]);
      vi.mocked(AmbassadorDAL.trackReferral).mockResolvedValue({
        id: 'referral-id',
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        referralCode: 'ABC123',
        status: 'pending',
      } as any);

      vi.mocked(AmbassadorDAL.getReferrals).mockResolvedValue([]);
      vi.mocked(AmbassadorDAL.updateAmbassadorDiscount).mockResolvedValue(ambassador as any);

      const result = await AmbassadorService.trackSignup('ABC123', referredUser.id);

      expect(result.success).toBe(true);
      expect(AmbassadorDAL.trackReferral).toHaveBeenCalledWith(
        ambassador.id,
        referredUser.id,
        'ABC123',
        undefined
      );
    });

    it('should handle custom link codes with underscore', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'active',
        discountPercentage: '20.00',
      };

      const customLink = {
        id: 'link-id',
        code: 'ABC123_CAMPAIGN',
        ambassadorId: ambassador.id,
      };

      vi.mocked(AmbassadorDAL.getAmbassadorByCode).mockResolvedValue({
        ambassador: ambassador as any,
        user: testUser,
      });

      vi.mocked(AmbassadorDAL.getReferralByUserId).mockResolvedValue(null);
      vi.mocked(AmbassadorDAL.getAmbassadorLinks).mockResolvedValue([customLink as any]);
      vi.mocked(AmbassadorDAL.trackReferral).mockResolvedValue({
        id: 'referral-id',
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        referralCode: 'ABC123_CAMPAIGN',
        linkId: customLink.id,
        status: 'pending',
      } as any);

      vi.mocked(AmbassadorDAL.getReferrals).mockResolvedValue([]);
      vi.mocked(AmbassadorDAL.updateAmbassadorDiscount).mockResolvedValue(ambassador as any);

      const result = await AmbassadorService.trackSignup('ABC123_CAMPAIGN', referredUser.id);

      expect(result.success).toBe(true);
      expect(AmbassadorDAL.trackReferral).toHaveBeenCalledWith(
        ambassador.id,
        referredUser.id,
        'ABC123_CAMPAIGN',
        customLink.id
      );
    });

    it('should reject invalid referral code', async () => {
      vi.mocked(AmbassadorDAL.getAmbassadorByCode).mockResolvedValue(null);

      const result = await AmbassadorService.trackSignup('INVALID', referredUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid referral code');
    });

    it('should reject inactive ambassador', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'suspended',
        discountPercentage: '20.00',
      };

      vi.mocked(AmbassadorDAL.getAmbassadorByCode).mockResolvedValue({
        ambassador: ambassador as any,
        user: testUser,
      });

      const result = await AmbassadorService.trackSignup('ABC123', referredUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });

    it('should reject duplicate referral', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'active',
        discountPercentage: '20.00',
      };

      vi.mocked(AmbassadorDAL.getAmbassadorByCode).mockResolvedValue({
        ambassador: ambassador as any,
        user: testUser,
      });

      vi.mocked(AmbassadorDAL.getReferralByUserId).mockResolvedValue({
        referral: { id: 'existing-referral' } as any,
        ambassador: ambassador as any,
      });

      const result = await AmbassadorService.trackSignup('ABC123', referredUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already has a referral');
    });

    it('should update volume tier after signup', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'active',
        discountPercentage: '20.00',
      };

      vi.mocked(AmbassadorDAL.getAmbassadorByCode).mockResolvedValue({
        ambassador: ambassador as any,
        user: testUser,
      });

      vi.mocked(AmbassadorDAL.getReferralByUserId).mockResolvedValue(null);
      vi.mocked(AmbassadorDAL.getAmbassadorLinks).mockResolvedValue([]);
      vi.mocked(AmbassadorDAL.trackReferral).mockResolvedValue({
        id: 'referral-id',
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        referralCode: 'ABC123',
        status: 'pending',
      } as any);

      // Mock 10 referrals (should trigger Silver tier)
      vi.mocked(AmbassadorDAL.getReferrals).mockResolvedValue(
        Array(10).fill(null).map((_, i) => ({
          referral: { id: `ref-${i}` } as any,
        }))
      );
      vi.mocked(AmbassadorDAL.updateAmbassadorDiscount).mockResolvedValue({
        ...ambassador,
        discountPercentage: '25.00',
      } as any);

      const result = await AmbassadorService.trackSignup('ABC123', referredUser.id);

      expect(result.success).toBe(true);
      expect(AmbassadorDAL.updateAmbassadorDiscount).toHaveBeenCalledWith(
        ambassador.id,
        25.0
      );
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate discount correctly', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'active',
        discountPercentage: '20.00',
      };

      vi.mocked(AmbassadorDAL.getAmbassadorByCode).mockResolvedValue({
        ambassador: ambassador as any,
        user: testUser,
      });

      const result = await AmbassadorService.calculateDiscount('ABC123', 100);

      expect(result.discountAmount).toBe(20);
      expect(result.discountPercentage).toBe(20);
      expect(result.netAmount).toBe(80);
    });

    it('should return 0 discount for inactive ambassador', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'suspended',
        discountPercentage: '20.00',
      };

      vi.mocked(AmbassadorDAL.getAmbassadorByCode).mockResolvedValue({
        ambassador: ambassador as any,
        user: testUser,
      });

      const result = await AmbassadorService.calculateDiscount('ABC123', 100);

      expect(result.discountAmount).toBe(0);
      expect(result.discountPercentage).toBe(0);
      expect(result.netAmount).toBe(100);
    });

    it('should return 0 discount for invalid code', async () => {
      vi.mocked(AmbassadorDAL.getAmbassadorByCode).mockResolvedValue(null);

      const result = await AmbassadorService.calculateDiscount('INVALID', 100);

      expect(result.discountAmount).toBe(0);
      expect(result.discountPercentage).toBe(0);
      expect(result.netAmount).toBe(100);
    });

    it('should use current tier discount percentage', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'active',
        discountPercentage: '30.00', // Gold tier
      };

      vi.mocked(AmbassadorDAL.getAmbassadorByCode).mockResolvedValue({
        ambassador: ambassador as any,
        user: testUser,
      });

      const result = await AmbassadorService.calculateDiscount('ABC123', 100);

      expect(result.discountAmount).toBe(30);
      expect(result.discountPercentage).toBe(30);
      expect(result.netAmount).toBe(70);
    });
  });

  describe('processSubscriptionPayment', () => {
    it('should process commission for first subscription', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'active',
        commissionPercentage: '25.00',
      };

      const referral = {
        id: 'referral-id',
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        commissionMonthsRemaining: 6,
        firstSubscriptionAt: null,
      };

      vi.mocked(AmbassadorDAL.getReferralByUserId).mockResolvedValue({
        referral: referral as any,
        ambassador: ambassador as any,
      });

      vi.mocked(AmbassadorDAL.updateReferralOnSubscription).mockResolvedValue({
        ...referral,
        firstSubscriptionAt: new Date(),
        subscriptionId: 'sub-id',
        status: 'active',
      } as any);

      vi.mocked(AmbassadorDAL.recordCommission).mockResolvedValue({
        id: 'commission-id',
        ambassadorId: ambassador.id,
        referralId: referral.id,
        commissionAmount: '25.00',
      } as any);

      vi.mocked(AmbassadorDAL.getReferrals).mockResolvedValue([]);
      vi.mocked(AmbassadorDAL.updateAmbassadorDiscount).mockResolvedValue(ambassador as any);

      const result = await AmbassadorService.processSubscriptionPayment(
        referredUser.id,
        'sub-id',
        'payment-order-id',
        100, // original amount
        20,  // discount amount
        new Date(),
        new Date(),
        'USD'
      );

      expect(result.success).toBe(true);
      expect(result.commissionAmount).toBe(25); // 25% of 100
      expect(AmbassadorDAL.updateReferralOnSubscription).toHaveBeenCalled();
      expect(AmbassadorDAL.recordCommission).toHaveBeenCalled();
    });

    it('should reject expired commission period', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'active',
        commissionPercentage: '25.00',
      };

      const referral = {
        id: 'referral-id',
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        commissionMonthsRemaining: 0, // Expired
        firstSubscriptionAt: new Date(),
      };

      vi.mocked(AmbassadorDAL.getReferralByUserId).mockResolvedValue({
        referral: referral as any,
        ambassador: ambassador as any,
      });

      const result = await AmbassadorService.processSubscriptionPayment(
        referredUser.id,
        'sub-id',
        'payment-order-id',
        100,
        20,
        new Date(),
        new Date(),
        'USD'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Commission period expired');
    });

    it('should reject inactive ambassador', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'suspended',
        commissionPercentage: '25.00',
      };

      const referral = {
        id: 'referral-id',
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        commissionMonthsRemaining: 6,
      };

      vi.mocked(AmbassadorDAL.getReferralByUserId).mockResolvedValue({
        referral: referral as any,
        ambassador: ambassador as any,
      });

      const result = await AmbassadorService.processSubscriptionPayment(
        referredUser.id,
        'sub-id',
        'payment-order-id',
        100,
        20,
        new Date(),
        new Date(),
        'USD'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });

    it('should calculate commission on original amount, not discounted', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'active',
        commissionPercentage: '25.00',
      };

      const referral = {
        id: 'referral-id',
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        commissionMonthsRemaining: 6,
        firstSubscriptionAt: new Date(),
      };

      vi.mocked(AmbassadorDAL.getReferralByUserId).mockResolvedValue({
        referral: referral as any,
        ambassador: ambassador as any,
      });

      vi.mocked(AmbassadorDAL.updateReferralOnSubscription).mockResolvedValue(referral as any);
      vi.mocked(AmbassadorDAL.recordCommission).mockResolvedValue({
        id: 'commission-id',
        commissionAmount: '25.00',
      } as any);

      vi.mocked(AmbassadorDAL.getReferrals).mockResolvedValue([]);
      vi.mocked(AmbassadorDAL.updateAmbassadorDiscount).mockResolvedValue(ambassador as any);

      const result = await AmbassadorService.processSubscriptionPayment(
        referredUser.id,
        'sub-id',
        'payment-order-id',
        100, // Original amount
        20,  // Discount (20% of 100)
        new Date(),
        new Date(),
        'USD'
      );

      expect(result.success).toBe(true);
      // Commission should be 25% of 100, not 25% of 80
      expect(result.commissionAmount).toBe(25);
      expect(AmbassadorDAL.recordCommission).toHaveBeenCalledWith(
        ambassador.id,
        referral.id,
        'sub-id',
        'payment-order-id',
        expect.any(Date),
        expect.any(Date),
        100, // Original amount
        20,  // Discount amount
        25,  // Commission percentage
        25,  // Commission amount (25% of 100)
        'USD'
      );
    });

    it('should update volume tier after subscription payment', async () => {
      const ambassador = {
        id: 'ambassador-id',
        code: 'ABC123',
        status: 'active',
        commissionPercentage: '25.00',
        discountPercentage: '20.00',
      };

      const referral = {
        id: 'referral-id',
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        commissionMonthsRemaining: 6,
        firstSubscriptionAt: new Date(),
      };

      vi.mocked(AmbassadorDAL.getReferralByUserId).mockResolvedValue({
        referral: referral as any,
        ambassador: ambassador as any,
      });

      vi.mocked(AmbassadorDAL.updateReferralOnSubscription).mockResolvedValue(referral as any);
      vi.mocked(AmbassadorDAL.recordCommission).mockResolvedValue({
        id: 'commission-id',
        commissionAmount: '25.00',
      } as any);

      // Mock 10 referrals (should trigger Silver tier)
      vi.mocked(AmbassadorDAL.getReferrals).mockResolvedValue(
        Array(10).fill(null).map((_, i) => ({
          referral: { id: `ref-${i}` } as any,
        }))
      );
      vi.mocked(AmbassadorDAL.updateAmbassadorDiscount).mockResolvedValue({
        ...ambassador,
        discountPercentage: '25.00',
      } as any);

      const result = await AmbassadorService.processSubscriptionPayment(
        referredUser.id,
        'sub-id',
        'payment-order-id',
        100,
        20,
        new Date(),
        new Date(),
        'USD'
      );

      expect(result.success).toBe(true);
      expect(AmbassadorDAL.updateAmbassadorDiscount).toHaveBeenCalledWith(
        ambassador.id,
        25.0
      );
    });
  });

  describe('calculateVolumeTier', () => {
    it('should return Bronze tier for 0-9 referrals', async () => {
      vi.mocked(AmbassadorDAL.getVolumeTiers).mockResolvedValue([
        { tierName: 'Bronze', minReferrals: 0, discountPercentage: '20.00' } as any,
        { tierName: 'Silver', minReferrals: 10, discountPercentage: '25.00' } as any,
        { tierName: 'Gold', minReferrals: 50, discountPercentage: '30.00' } as any,
        { tierName: 'Platinum', minReferrals: 100, discountPercentage: '35.00' } as any,
      ]);

      const result = await AmbassadorService.calculateVolumeTier(5);

      expect(result.tierName).toBe('Bronze');
      expect(result.discountPercentage).toBe(20);
    });

    it('should return Silver tier for 10-49 referrals', async () => {
      vi.mocked(AmbassadorDAL.getVolumeTiers).mockResolvedValue([
        { tierName: 'Bronze', minReferrals: 0, discountPercentage: '20.00' } as any,
        { tierName: 'Silver', minReferrals: 10, discountPercentage: '25.00' } as any,
        { tierName: 'Gold', minReferrals: 50, discountPercentage: '30.00' } as any,
        { tierName: 'Platinum', minReferrals: 100, discountPercentage: '35.00' } as any,
      ]);

      const result = await AmbassadorService.calculateVolumeTier(25);

      expect(result.tierName).toBe('Silver');
      expect(result.discountPercentage).toBe(25);
    });

    it('should return Gold tier for 50-99 referrals', async () => {
      vi.mocked(AmbassadorDAL.getVolumeTiers).mockResolvedValue([
        { tierName: 'Bronze', minReferrals: 0, discountPercentage: '20.00' } as any,
        { tierName: 'Silver', minReferrals: 10, discountPercentage: '25.00' } as any,
        { tierName: 'Gold', minReferrals: 50, discountPercentage: '30.00' } as any,
        { tierName: 'Platinum', minReferrals: 100, discountPercentage: '35.00' } as any,
      ]);

      const result = await AmbassadorService.calculateVolumeTier(75);

      expect(result.tierName).toBe('Gold');
      expect(result.discountPercentage).toBe(30);
    });

    it('should return Platinum tier for 100+ referrals', async () => {
      vi.mocked(AmbassadorDAL.getVolumeTiers).mockResolvedValue([
        { tierName: 'Bronze', minReferrals: 0, discountPercentage: '20.00' } as any,
        { tierName: 'Silver', minReferrals: 10, discountPercentage: '25.00' } as any,
        { tierName: 'Gold', minReferrals: 50, discountPercentage: '30.00' } as any,
        { tierName: 'Platinum', minReferrals: 100, discountPercentage: '35.00' } as any,
      ]);

      const result = await AmbassadorService.calculateVolumeTier(150);

      expect(result.tierName).toBe('Platinum');
      expect(result.discountPercentage).toBe(35);
    });

    it('should handle exact tier thresholds', async () => {
      vi.mocked(AmbassadorDAL.getVolumeTiers).mockResolvedValue([
        { tierName: 'Bronze', minReferrals: 0, discountPercentage: '20.00' } as any,
        { tierName: 'Silver', minReferrals: 10, discountPercentage: '25.00' } as any,
        { tierName: 'Gold', minReferrals: 50, discountPercentage: '30.00' } as any,
        { tierName: 'Platinum', minReferrals: 100, discountPercentage: '35.00' } as any,
      ]);

      expect((await AmbassadorService.calculateVolumeTier(10)).tierName).toBe('Silver');
      expect((await AmbassadorService.calculateVolumeTier(50)).tierName).toBe('Gold');
      expect((await AmbassadorService.calculateVolumeTier(100)).tierName).toBe('Platinum');
    });
  });
});

