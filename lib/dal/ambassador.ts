import { db } from '@/lib/db';
import {
  ambassadors,
  ambassadorLinks,
  ambassadorReferrals,
  ambassadorCommissions,
  ambassadorPayouts,
  ambassadorVolumeTiers,
  users,
  userSubscriptions,
} from '@/lib/db/schema';
import { eq, and, desc, gte, lte, sql, or } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export class AmbassadorDAL {
  /**
   * Create ambassador application
   */
  static async createApplication(userId: string, applicationData: Record<string, any>) {
    logger.log('👤 AmbassadorDAL: Creating application for user:', userId);

    try {
      const [application] = await db
        .insert(ambassadors)
        .values({
          userId,
          status: 'pending',
          applicationData,
        })
        .returning();

      logger.log('✅ AmbassadorDAL: Application created:', application.id);
      return application;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error creating application:', error);
      throw error;
    }
  }

  /**
   * Get ambassador by user ID
   */
  static async getAmbassadorByUserId(userId: string) {
    logger.log('🔍 AmbassadorDAL: Getting ambassador by user ID:', userId);

    try {
      const [ambassador] = await db
        .select({
          ambassador: ambassadors,
          user: users,
        })
        .from(ambassadors)
        .leftJoin(users, eq(ambassadors.userId, users.id))
        .where(eq(ambassadors.userId, userId))
        .limit(1);

      if (!ambassador) {
        logger.log('❌ AmbassadorDAL: Ambassador not found');
        return null;
      }

      logger.log('✅ AmbassadorDAL: Ambassador found:', ambassador.ambassador.code);
      return ambassador;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error getting ambassador:', error);
      throw error;
    }
  }

  /**
   * Get ambassador by ID
   */
  static async getAmbassadorById(ambassadorId: string) {
    logger.log('🔍 AmbassadorDAL: Getting ambassador by ID:', ambassadorId);

    try {
      const [ambassador] = await db
        .select({
          ambassador: ambassadors,
          user: users,
        })
        .from(ambassadors)
        .leftJoin(users, eq(ambassadors.userId, users.id))
        .where(eq(ambassadors.id, ambassadorId))
        .limit(1);

      if (!ambassador) {
        logger.log('❌ AmbassadorDAL: Ambassador not found');
        return null;
      }

      logger.log('✅ AmbassadorDAL: Ambassador found:', ambassador.ambassador.code);
      return ambassador;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error getting ambassador:', error);
      throw error;
    }
  }

  /**
   * Get ambassador by code
   */
  static async getAmbassadorByCode(code: string) {
    logger.log('🔍 AmbassadorDAL: Getting ambassador by code:', code);

    try {
      const [ambassador] = await db
        .select({
          ambassador: ambassadors,
          user: users,
        })
        .from(ambassadors)
        .leftJoin(users, eq(ambassadors.userId, users.id))
        .where(eq(ambassadors.code, code.toUpperCase()))
        .limit(1);

      if (!ambassador) {
        logger.log('❌ AmbassadorDAL: Ambassador not found for code:', code);
        return null;
      }

      logger.log('✅ AmbassadorDAL: Ambassador found:', ambassador.ambassador.id);
      return ambassador;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error getting ambassador by code:', error);
      throw error;
    }
  }

  /**
   * Update ambassador status
   */
  static async updateAmbassadorStatus(
    ambassadorId: string,
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'suspended',
    adminId?: string,
    rejectedReason?: string
  ) {
    logger.log('🔄 AmbassadorDAL: Updating ambassador status:', { ambassadorId, status });

    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'approved' || status === 'active') {
        updateData.approvedBy = adminId;
        updateData.approvedAt = new Date();
      }

      if (status === 'rejected' && rejectedReason) {
        updateData.rejectedReason = rejectedReason;
      }

      const [updated] = await db
        .update(ambassadors)
        .set(updateData)
        .where(eq(ambassadors.id, ambassadorId))
        .returning();

      logger.log('✅ AmbassadorDAL: Status updated:', updated.status);
      return updated;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error updating status:', error);
      throw error;
    }
  }

  /**
   * Generate unique ambassador code
   */
  static async generateUniqueCode(): Promise<string> {
    logger.log('🔑 AmbassadorDAL: Generating unique code');

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      // Generate 6-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const existing = await db
        .select()
        .from(ambassadors)
        .where(eq(ambassadors.code, code))
        .limit(1);

      if (existing.length === 0) {
        logger.log('✅ AmbassadorDAL: Unique code generated:', code);
        return code;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique ambassador code');
  }

  /**
   * Set ambassador code (called after approval)
   */
  static async setAmbassadorCode(ambassadorId: string, code: string) {
    logger.log('🔑 AmbassadorDAL: Setting ambassador code:', { ambassadorId, code });

    try {
      const [updated] = await db
        .update(ambassadors)
        .set({
          code,
          updatedAt: new Date(),
        })
        .where(eq(ambassadors.id, ambassadorId))
        .returning();

      logger.log('✅ AmbassadorDAL: Code set:', updated.code);
      return updated;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error setting code:', error);
      throw error;
    }
  }

  /**
   * Create custom ambassador link
   */
  static async createCustomLink(
    ambassadorId: string,
    code: string,
    url: string,
    campaignName?: string,
    description?: string
  ) {
    logger.log('🔗 AmbassadorDAL: Creating custom link:', { ambassadorId, code });

    try {
      const [link] = await db
        .insert(ambassadorLinks)
        .values({
          ambassadorId,
          code,
          url,
          campaignName,
          description,
        })
        .returning();

      logger.log('✅ AmbassadorDAL: Custom link created:', link.id);
      return link;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error creating custom link:', error);
      throw error;
    }
  }

  /**
   * Get ambassador links
   */
  static async getAmbassadorLinks(ambassadorId: string, includeInactive = false) {
    logger.log('🔗 AmbassadorDAL: Getting ambassador links:', ambassadorId);

    try {
      const whereConditions = includeInactive
        ? eq(ambassadorLinks.ambassadorId, ambassadorId)
        : and(eq(ambassadorLinks.ambassadorId, ambassadorId), eq(ambassadorLinks.isActive, true));

      const links = await db
        .select()
        .from(ambassadorLinks)
        .where(whereConditions)
        .orderBy(desc(ambassadorLinks.createdAt));

      logger.log('✅ AmbassadorDAL: Found', links.length, 'links');
      return links;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error getting links:', error);
      throw error;
    }
  }

  /**
   * Track referral (user signup via ambassador link)
   */
  static async trackReferral(
    ambassadorId: string,
    referredUserId: string,
    referralCode: string,
    linkId?: string
  ) {
    logger.log('📊 AmbassadorDAL: Tracking referral:', { ambassadorId, referredUserId, referralCode });

    try {
      const [referral] = await db
        .insert(ambassadorReferrals)
        .values({
          ambassadorId,
          referredUserId,
          linkId,
          referralCode: referralCode.toUpperCase(),
          status: 'pending',
        })
        .returning();

      // Update link stats
      if (linkId) {
        await db
          .update(ambassadorLinks)
          .set({
            signupCount: sql`${ambassadorLinks.signupCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(ambassadorLinks.id, linkId));
      }

      // Update ambassador total referrals
      await db
        .update(ambassadors)
        .set({
          totalReferrals: sql`${ambassadors.totalReferrals} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(ambassadors.id, ambassadorId));

      logger.log('✅ AmbassadorDAL: Referral tracked:', referral.id);
      return referral;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error tracking referral:', error);
      throw error;
    }
  }

  /**
   * Get referrals for ambassador
   */
  static async getReferrals(ambassadorId: string, filters?: { status?: string }) {
    logger.log('📊 AmbassadorDAL: Getting referrals:', ambassadorId);

    try {
      const whereConditions = filters?.status
        ? and(eq(ambassadorReferrals.ambassadorId, ambassadorId), eq(ambassadorReferrals.status, filters.status as any))
        : eq(ambassadorReferrals.ambassadorId, ambassadorId);

      const referrals = await db
        .select({
          referral: ambassadorReferrals,
          user: users,
          link: ambassadorLinks,
        })
        .from(ambassadorReferrals)
        .leftJoin(users, eq(ambassadorReferrals.referredUserId, users.id))
        .leftJoin(ambassadorLinks, eq(ambassadorReferrals.linkId, ambassadorLinks.id))
        .where(whereConditions)
        .orderBy(desc(ambassadorReferrals.createdAt));

      logger.log('✅ AmbassadorDAL: Found', referrals.length, 'referrals');
      return referrals;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error getting referrals:', error);
      throw error;
    }
  }

  /**
   * Update referral when user subscribes
   */
  static async updateReferralOnSubscription(
    referralId: string,
    subscriptionId: string,
    firstSubscription: boolean
  ) {
    logger.log('💳 AmbassadorDAL: Updating referral on subscription:', { referralId, subscriptionId });

    try {
      const updateData: any = {
        subscriptionId,
        status: 'active',
        updatedAt: new Date(),
      };

      if (firstSubscription) {
        updateData.firstSubscriptionAt = new Date();
      }

      const [updated] = await db
        .update(ambassadorReferrals)
        .set(updateData)
        .where(eq(ambassadorReferrals.id, referralId))
        .returning();

      // Update link conversion count
      if (updated.linkId) {
        await db
          .update(ambassadorLinks)
          .set({
            conversionCount: sql`${ambassadorLinks.conversionCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(ambassadorLinks.id, updated.linkId));
      }

      logger.log('✅ AmbassadorDAL: Referral updated');
      return updated;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error updating referral:', error);
      throw error;
    }
  }

  /**
   * Record commission
   */
  static async recordCommission(
    ambassadorId: string,
    referralId: string,
    subscriptionId: string,
    paymentOrderId: string,
    periodStart: Date,
    periodEnd: Date,
    subscriptionAmount: number,
    discountAmount: number,
    commissionPercentage: number,
    commissionAmount: number,
    currency: string = 'USD'
  ) {
    logger.log('💰 AmbassadorDAL: Recording commission:', { ambassadorId, referralId, commissionAmount });

    try {
      const [commission] = await db
        .insert(ambassadorCommissions)
        .values({
          ambassadorId,
          referralId,
          subscriptionId,
          paymentOrderId,
          periodStart,
          periodEnd,
          subscriptionAmount: subscriptionAmount.toString(),
          discountAmount: discountAmount.toString(),
          commissionPercentage: commissionPercentage.toString(),
          commissionAmount: commissionAmount.toString(),
          currency,
          status: 'pending',
        })
        .returning();

      // Update referral total commission
      await db
        .update(ambassadorReferrals)
        .set({
          totalCommissionEarned: sql`${ambassadorReferrals.totalCommissionEarned} + ${commissionAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(ambassadorReferrals.id, referralId));

      // Update ambassador earnings
      await db
        .update(ambassadors)
        .set({
          totalEarnings: sql`${ambassadors.totalEarnings} + ${commissionAmount}`,
          pendingEarnings: sql`${ambassadors.pendingEarnings} + ${commissionAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(ambassadors.id, ambassadorId));

      logger.log('✅ AmbassadorDAL: Commission recorded:', commission.id);
      return commission;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error recording commission:', error);
      throw error;
    }
  }

  /**
   * Get commissions for ambassador
   */
  static async getCommissions(
    ambassadorId: string,
    filters?: { status?: string; payoutPeriodId?: string; startDate?: Date; endDate?: Date }
  ) {
    logger.log('💰 AmbassadorDAL: Getting commissions:', ambassadorId);

    try {
      const conditions = [eq(ambassadorCommissions.ambassadorId, ambassadorId)];

      if (filters?.status) {
        conditions.push(eq(ambassadorCommissions.status, filters.status as any));
      }

      if (filters?.payoutPeriodId) {
        conditions.push(eq(ambassadorCommissions.payoutPeriodId, filters.payoutPeriodId));
      }

      if (filters?.startDate) {
        conditions.push(gte(ambassadorCommissions.periodStart, filters.startDate));
      }

      if (filters?.endDate) {
        conditions.push(lte(ambassadorCommissions.periodEnd, filters.endDate));
      }

      const commissions = await db
        .select({
          commission: ambassadorCommissions,
          referral: ambassadorReferrals,
          subscription: userSubscriptions,
        })
        .from(ambassadorCommissions)
        .leftJoin(ambassadorReferrals, eq(ambassadorCommissions.referralId, ambassadorReferrals.id))
        .leftJoin(userSubscriptions, eq(ambassadorCommissions.subscriptionId, userSubscriptions.id))
        .where(and(...conditions))
        .orderBy(desc(ambassadorCommissions.createdAt));

      logger.log('✅ AmbassadorDAL: Found', commissions.length, 'commissions');
      return commissions;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error getting commissions:', error);
      throw error;
    }
  }

  /**
   * Create payout period
   */
  static async createPayoutPeriod(
    ambassadorId: string,
    periodStart: Date,
    periodEnd: Date,
    totalCommissions: number,
    commissionCount: number
  ) {
    logger.log('💵 AmbassadorDAL: Creating payout period:', { ambassadorId, periodStart, periodEnd });

    try {
      const [payout] = await db
        .insert(ambassadorPayouts)
        .values({
          ambassadorId,
          periodStart,
          periodEnd,
          totalCommissions: totalCommissions.toString(),
          commissionCount,
          status: 'pending',
        })
        .returning();

      logger.log('✅ AmbassadorDAL: Payout period created:', payout.id);
      return payout;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error creating payout period:', error);
      throw error;
    }
  }

  /**
   * Get payouts for ambassador
   */
  static async getPayouts(ambassadorId: string, filters?: { status?: string }) {
    logger.log('💵 AmbassadorDAL: Getting payouts:', ambassadorId);

    try {
      const whereConditions = filters?.status
        ? and(eq(ambassadorPayouts.ambassadorId, ambassadorId), eq(ambassadorPayouts.status, filters.status as any))
        : eq(ambassadorPayouts.ambassadorId, ambassadorId);

      const payouts = await db
        .select()
        .from(ambassadorPayouts)
        .where(whereConditions)
        .orderBy(desc(ambassadorPayouts.createdAt));

      logger.log('✅ AmbassadorDAL: Found', payouts.length, 'payouts');
      return payouts;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error getting payouts:', error);
      throw error;
    }
  }

  /**
   * Update payout status
   */
  static async updatePayoutStatus(
    payoutId: string,
    status: 'pending' | 'processing' | 'paid' | 'failed',
    paymentMethod?: string,
    paymentReference?: string,
    paidBy?: string
  ) {
    logger.log('💵 AmbassadorDAL: Updating payout status:', { payoutId, status });

    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'paid') {
        updateData.paidAt = new Date();
        updateData.paymentMethod = paymentMethod;
        updateData.paymentReference = paymentReference;
        updateData.paidBy = paidBy;
      }

      const [updated] = await db
        .update(ambassadorPayouts)
        .set(updateData)
        .where(eq(ambassadorPayouts.id, payoutId))
        .returning();

      // If paid, update commissions and ambassador earnings
      if (status === 'paid') {
        await db
          .update(ambassadorCommissions)
          .set({
            status: 'paid',
            updatedAt: new Date(),
          })
          .where(eq(ambassadorCommissions.payoutPeriodId, payoutId));

        // Move from pending to paid earnings
        const [payout] = await db
          .select()
          .from(ambassadorPayouts)
          .where(eq(ambassadorPayouts.id, payoutId))
          .limit(1);

        if (payout) {
          await db
            .update(ambassadors)
            .set({
              pendingEarnings: sql`${ambassadors.pendingEarnings} - ${payout.totalCommissions}`,
              paidEarnings: sql`${ambassadors.paidEarnings} + ${payout.totalCommissions}`,
              updatedAt: new Date(),
            })
            .where(eq(ambassadors.id, payout.ambassadorId));
        }
      }

      logger.log('✅ AmbassadorDAL: Payout status updated');
      return updated;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error updating payout status:', error);
      throw error;
    }
  }

  /**
   * Get volume tiers
   */
  static async getVolumeTiers() {
    logger.log('📊 AmbassadorDAL: Getting volume tiers');

    try {
      const tiers = await db
        .select()
        .from(ambassadorVolumeTiers)
        .where(eq(ambassadorVolumeTiers.isActive, true))
        .orderBy(ambassadorVolumeTiers.minReferrals);

      logger.log('✅ AmbassadorDAL: Found', tiers.length, 'tiers');
      return tiers;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error getting volume tiers:', error);
      throw error;
    }
  }

  /**
   * Update ambassador discount percentage based on volume tier
   */
  static async updateAmbassadorDiscount(ambassadorId: string, discountPercentage: number) {
    logger.log('📊 AmbassadorDAL: Updating ambassador discount:', { ambassadorId, discountPercentage });

    try {
      const [updated] = await db
        .update(ambassadors)
        .set({
          discountPercentage: discountPercentage.toString(),
          updatedAt: new Date(),
        })
        .where(eq(ambassadors.id, ambassadorId))
        .returning();

      logger.log('✅ AmbassadorDAL: Discount updated');
      return updated;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error updating discount:', error);
      throw error;
    }
  }

  /**
   * Check if referral exists for user
   */
  static async getReferralByUserId(referredUserId: string) {
    logger.log('🔍 AmbassadorDAL: Getting referral by user ID:', referredUserId);

    try {
      const [referral] = await db
        .select({
          referral: ambassadorReferrals,
          ambassador: ambassadors,
        })
        .from(ambassadorReferrals)
        .leftJoin(ambassadors, eq(ambassadorReferrals.ambassadorId, ambassadors.id))
        .where(eq(ambassadorReferrals.referredUserId, referredUserId))
        .limit(1);

      if (!referral) {
        return null;
      }

      logger.log('✅ AmbassadorDAL: Referral found');
      return referral;
    } catch (error) {
      logger.error('❌ AmbassadorDAL: Error getting referral:', error);
      throw error;
    }
  }
}

