import { AmbassadorDAL } from '@/lib/dal/ambassador';
import { db } from '@/lib/db';
import { ambassadors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export interface AmbassadorApplicationData {
  name: string;
  email: string;
  website?: string;
  socialMedia?: string;
  whyInterested?: string;
  audienceSize?: string;
  marketingChannels?: string[];
}

export interface AmbassadorStats {
  totalReferrals: number;
  activeSubscribers: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  conversionRate: number;
  clickThroughRate?: number;
}

export class AmbassadorService {
  /**
   * Apply for ambassador program
   * ✅ AUTO-GENERATES CODE: Code is automatically generated upon application creation
   */
  static async applyForAmbassador(userId: string, applicationData: AmbassadorApplicationData) {
    logger.log('📝 AmbassadorService: Processing application for user:', userId);

    try {
      // Check if user already has an application
      const existing = await AmbassadorDAL.getAmbassadorByUserId(userId);
      if (existing) {
        return {
          success: false,
          error: 'You already have an ambassador application. Please wait for review.',
          ambassador: existing.ambassador,
        };
      }

      // ✅ AUTO-GENERATE CODE: Generate unique code immediately upon application
      const code = await this.generateAmbassadorCode();
      logger.log('🔑 AmbassadorService: Auto-generated code for new application:', code);

      // Create application with code
      const application = await AmbassadorDAL.createApplication(userId, applicationData, code);

      logger.log('✅ AmbassadorService: Application created successfully with code:', code);
      return {
        success: true,
        ambassador: application,
        code, // Return code so it can be displayed if needed
      };
    } catch (error) {
      logger.error('❌ AmbassadorService: Error processing application:', error);
      throw error;
    }
  }

  /**
   * Generate unique ambassador code
   */
  static async generateAmbassadorCode(): Promise<string> {
    return await AmbassadorDAL.generateUniqueCode();
  }

  /**
   * Approve ambassador application
   * ✅ OPTIMIZED: Use transaction and combine updates (4 queries → 2 queries)
   * ✅ CODE PRESERVED: Code is already generated on application, just activate status
   */
  static async approveAmbassador(ambassadorId: string, adminId: string) {
    logger.log('✅ AmbassadorService: Approving ambassador:', ambassadorId);

    try {
      // ✅ FIXED: Get existing ambassador to check if code exists
      const existing = await AmbassadorDAL.getAmbassadorById(ambassadorId);
      if (!existing) {
        throw new Error('Ambassador not found');
      }

      // ✅ AUTO-GENERATE CODE: If code doesn't exist, generate one (backward compatibility)
      let code = existing.ambassador.code;
      if (!code) {
        logger.log('🔑 AmbassadorService: Code missing, generating new code for approval');
        code = await this.generateAmbassadorCode();
      } else {
        logger.log('✅ AmbassadorService: Using existing code:', code);
      }

      // ✅ OPTIMIZED: Use transaction and combine all updates into one
      return await db.transaction(async (tx) => {
        const [ambassador] = await tx
          .update(ambassadors)
          .set({
            status: 'active',
            code, // Ensure code is set (should already exist, but set it anyway)
            approvedBy: adminId,
            approvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(ambassadors.id, ambassadorId))
          .returning();

        if (!ambassador) {
          throw new Error('Ambassador not found');
        }

        logger.log('✅ AmbassadorService: Ambassador approved with code:', code);
        return {
          success: true,
          ambassador,
          code,
        };
      });
    } catch (error) {
      logger.error('❌ AmbassadorService: Error approving ambassador:', error);
      throw error;
    }
  }

  /**
   * Reject ambassador application
   */
  static async rejectAmbassador(ambassadorId: string, adminId: string, reason: string) {
    logger.log('❌ AmbassadorService: Rejecting ambassador:', ambassadorId);

    try {
      const ambassador = await AmbassadorDAL.updateAmbassadorStatus(
        ambassadorId,
        'rejected',
        adminId,
        reason
      );

      logger.log('✅ AmbassadorService: Ambassador rejected');
      return {
        success: true,
        ambassador,
      };
    } catch (error) {
      logger.error('❌ AmbassadorService: Error rejecting ambassador:', error);
      throw error;
    }
  }

  /**
   * Create custom tracking link
   */
  static async createCustomLink(
    ambassadorId: string,
    campaignName?: string,
    description?: string
  ) {
    logger.log('🔗 AmbassadorService: Creating custom link:', { ambassadorId, campaignName });

    try {
      // Get ambassador to get their base code
      const ambassadorData = await AmbassadorDAL.getAmbassadorById(ambassadorId);
      if (!ambassadorData) {
        return {
          success: false,
          error: 'Ambassador not found',
        };
      }

      const baseCode = ambassadorData.ambassador.code;
      
      // ✅ FIXED: Validate that ambassador code exists before creating link
      if (!baseCode) {
        logger.error('❌ AmbassadorService: Ambassador code is not set. Ambassador must be approved first.');
        return {
          success: false,
          error: 'Ambassador code is not set. Please contact support to activate your ambassador account.',
        };
      }

      const linkCode = campaignName
        ? `${baseCode}_${campaignName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)}`
        : `${baseCode}_${Date.now().toString(36).toUpperCase()}`;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://renderiq.com';
      const url = `${baseUrl}/signup?ref=${linkCode}`;

      const link = await AmbassadorDAL.createCustomLink(
        ambassadorId,
        linkCode,
        url,
        campaignName,
        description
      );

      logger.log('✅ AmbassadorService: Custom link created:', link.id);
      return {
        success: true,
        link,
      };
    } catch (error) {
      logger.error('❌ AmbassadorService: Error creating custom link:', error);
      throw error;
    }
  }

  /**
   * Track user signup via referral code
   */
  static async trackSignup(referralCode: string, userId: string) {
    logger.log('📊 AmbassadorService: Tracking signup:', { referralCode, userId });

    try {
      // ✅ FIXED: Handle custom link codes (e.g., "ABC123_CAMPAIGN")
      // Extract base code (before underscore) for ambassador lookup
      const baseCode = referralCode.includes('_') 
        ? referralCode.split('_')[0].toUpperCase()
        : referralCode.toUpperCase();

      // Get ambassador by base code
      const ambassadorData = await AmbassadorDAL.getAmbassadorByCode(baseCode);
      if (!ambassadorData) {
        logger.warn('⚠️ AmbassadorService: Ambassador not found for code:', baseCode);
        return {
          success: false,
          error: 'Invalid referral code',
        };
      }

      const ambassador = ambassadorData.ambassador;

      // Check if ambassador is active
      if (ambassador.status !== 'active') {
        logger.warn('⚠️ AmbassadorService: Ambassador not active:', ambassador.status);
        return {
          success: false,
          error: 'Ambassador account is not active',
        };
      }

      // Check if user was already referred
      const existingReferral = await AmbassadorDAL.getReferralByUserId(userId);
      if (existingReferral) {
        logger.warn('⚠️ AmbassadorService: User already referred');
        return {
          success: false,
          error: 'User already has a referral',
        };
      }

      // ✅ FIXED: Find custom link if this is a custom link code
      let linkId: string | undefined;
      if (referralCode.includes('_')) {
        // This is a custom link, find the link by code
        const links = await AmbassadorDAL.getAmbassadorLinks(ambassador.id, true);
        const matchingLink = links.find(link => link.code.toUpperCase() === referralCode.toUpperCase());
        if (matchingLink) {
          linkId = matchingLink.id;
          logger.log('🔗 AmbassadorService: Found custom link:', linkId);
        } else {
          logger.warn('⚠️ AmbassadorService: Custom link not found for code:', referralCode);
        }
      }

      // Track referral
      const referral = await AmbassadorDAL.trackReferral(
        ambassador.id,
        userId,
        referralCode.toUpperCase(),
        linkId
      );

      logger.log('✅ AmbassadorService: Signup tracked successfully');
      return {
        success: true,
        referral,
        ambassador,
      };
    } catch (error) {
      logger.error('❌ AmbassadorService: Error tracking signup:', error);
      throw error;
    }
  }

  /**
   * Calculate discount for user based on referral
   */
  static async calculateDiscount(referralCode: string, amount: number): Promise<{
    discountAmount: number;
    discountPercentage: number;
    netAmount: number;
  }> {
    logger.log('💰 AmbassadorService: Calculating discount:', { referralCode, amount });

    try {
      // Get ambassador by code
      const ambassadorData = await AmbassadorDAL.getAmbassadorByCode(referralCode);
      if (!ambassadorData) {
        return {
          discountAmount: 0,
          discountPercentage: 0,
          netAmount: amount,
        };
      }

      const ambassador = ambassadorData.ambassador;

      // Check if ambassador is active
      if (ambassador.status !== 'active') {
        return {
          discountAmount: 0,
          discountPercentage: 0,
          netAmount: amount,
        };
      }

      // Get discount percentage (may be updated based on volume tier)
      const discountPercentage = parseFloat(ambassador.discountPercentage.toString());
      const discountAmount = (amount * discountPercentage) / 100;
      const netAmount = amount - discountAmount;

      logger.log('✅ AmbassadorService: Discount calculated:', {
        discountPercentage,
        discountAmount,
        netAmount,
      });

      return {
        discountAmount,
        discountPercentage,
        netAmount,
      };
    } catch (error) {
      logger.error('❌ AmbassadorService: Error calculating discount:', error);
      // Return no discount on error
      return {
        discountAmount: 0,
        discountPercentage: 0,
        netAmount: amount,
      };
    }
  }

  /**
   * Process subscription payment and calculate commission
   */
  static async processSubscriptionPayment(
    userId: string,
    subscriptionId: string,
    paymentOrderId: string,
    subscriptionAmount: number,
    discountAmount: number,
    periodStart: Date,
    periodEnd: Date,
    currency: string = 'USD'
  ) {
    logger.log('💳 AmbassadorService: Processing subscription payment:', {
      userId,
      subscriptionId,
      subscriptionAmount,
    });

    try {
      // Get referral for user
      const referralData = await AmbassadorDAL.getReferralByUserId(userId);
      if (!referralData) {
        logger.log('ℹ️ AmbassadorService: No referral found for user');
        return {
          success: false,
          error: 'No referral found',
        };
      }

      const referral = referralData.referral;
      const ambassador = referralData.ambassador;

      // Check if ambassador is active
      if (ambassador.status !== 'active') {
        logger.warn('⚠️ AmbassadorService: Ambassador not active');
        return {
          success: false,
          error: 'Ambassador not active',
        };
      }

      // Check if commission period is still valid
      if (referral.commissionMonthsRemaining <= 0) {
        logger.log('ℹ️ AmbassadorService: Commission period expired');
        return {
          success: false,
          error: 'Commission period expired',
        };
      }

      // Check if this is first subscription
      const isFirstSubscription = !referral.firstSubscriptionAt;

      // Update referral if first subscription
      if (isFirstSubscription) {
        await AmbassadorDAL.updateReferralOnSubscription(referral.id, subscriptionId, true);
      }

      // Calculate commission (25% of original amount, not discounted)
      const commissionPercentage = parseFloat(ambassador.commissionPercentage.toString());
      const commissionAmount = (subscriptionAmount * commissionPercentage) / 100;

      // Record commission
      const commission = await AmbassadorDAL.recordCommission(
        ambassador.id,
        referral.id,
        subscriptionId,
        paymentOrderId,
        periodStart,
        periodEnd,
        subscriptionAmount,
        discountAmount,
        commissionPercentage,
        commissionAmount,
        currency
      );

      // Decrement commission months remaining
      // This will be handled in a separate update if needed

      logger.log('✅ AmbassadorService: Commission recorded:', commissionAmount);
      return {
        success: true,
        commission,
        commissionAmount,
      };
    } catch (error) {
      logger.error('❌ AmbassadorService: Error processing subscription payment:', error);
      throw error;
    }
  }

  /**
   * Calculate commission amount
   */
  static calculateCommission(
    subscriptionAmount: number,
    discountAmount: number,
    commissionPercentage: number
  ): number {
    // Commission is calculated on original amount, not discounted
    return (subscriptionAmount * commissionPercentage) / 100;
  }

  /**
   * Get ambassador stats
   * ✅ OPTIMIZED: Parallelize independent queries (3 queries → 1 parallel batch)
   */
  static async getAmbassadorStats(ambassadorId: string): Promise<AmbassadorStats> {
    logger.log('📊 AmbassadorService: Getting ambassador stats:', ambassadorId);

    try {
      // ✅ OPTIMIZED: Parallelize independent queries
      const [ambassadorData, referrals, commissions] = await Promise.all([
        AmbassadorDAL.getAmbassadorById(ambassadorId),
        AmbassadorDAL.getReferrals(ambassadorId),
        AmbassadorDAL.getCommissions(ambassadorId),
      ]);

      if (!ambassadorData) {
        throw new Error('Ambassador not found');
      }

      const activeSubscribers = referrals.filter(
        (r) => r.referral.status === 'active' && r.referral.subscriptionId
      ).length;

      const totalEarnings = parseFloat(
        commissions
          .reduce((sum, c) => sum + parseFloat(c.commission.commissionAmount.toString()), 0)
          .toString()
      );

      const pendingEarnings = parseFloat(
        commissions
          .filter((c) => c.commission.status === 'pending')
          .reduce((sum, c) => sum + parseFloat(c.commission.commissionAmount.toString()), 0)
          .toString()
      );

      const paidEarnings = parseFloat(
        commissions
          .filter((c) => c.commission.status === 'paid')
          .reduce((sum, c) => sum + parseFloat(c.commission.commissionAmount.toString()), 0)
          .toString()
      );

      const signups = referrals.length;
      const conversions = referrals.filter((r) => r.referral.subscriptionId).length;
      const conversionRate = signups > 0 ? (conversions / signups) * 100 : 0;

      return {
        totalReferrals: signups,
        activeSubscribers,
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        conversionRate,
      };
    } catch (error) {
      logger.error('❌ AmbassadorService: Error getting stats:', error);
      throw error;
    }
  }

  /**
   * Calculate volume tier based on referral count
   */
  static async calculateVolumeTier(referralCount: number): Promise<{
    tierName: string;
    discountPercentage: number;
  }> {
    logger.log('📊 AmbassadorService: Calculating volume tier:', referralCount);

    try {
      const tiers = await AmbassadorDAL.getVolumeTiers();

      // Sort by min_referrals descending to find the highest tier user qualifies for
      const sortedTiers = tiers.sort((a, b) => b.minReferrals - a.minReferrals);

      for (const tier of sortedTiers) {
        if (referralCount >= tier.minReferrals) {
          return {
            tierName: tier.tierName,
            discountPercentage: parseFloat(tier.discountPercentage.toString()),
          };
        }
      }

      // Default to lowest tier
      return {
        tierName: 'Bronze',
        discountPercentage: 20.0,
      };
    } catch (error) {
      logger.error('❌ AmbassadorService: Error calculating volume tier:', error);
      return {
        tierName: 'Bronze',
        discountPercentage: 20.0,
      };
    }
  }

  /**
   * Update ambassador volume tier
   */
  static async updateAmbassadorVolumeTier(ambassadorId: string) {
    logger.log('📊 AmbassadorService: Updating volume tier:', ambassadorId);

    try {
      const ambassadorData = await AmbassadorDAL.getAmbassadorById(ambassadorId);
      if (!ambassadorData) {
        throw new Error('Ambassador not found');
      }

      const referrals = await AmbassadorDAL.getReferrals(ambassadorId);
      const referralCount = referrals.length;

      // Calculate tier
      const tier = await this.calculateVolumeTier(referralCount);

      // Update ambassador discount
      await AmbassadorDAL.updateAmbassadorDiscount(ambassadorId, tier.discountPercentage);

      logger.log('✅ AmbassadorService: Volume tier updated:', tier.tierName);
      return tier;
    } catch (error) {
      logger.error('❌ AmbassadorService: Error updating volume tier:', error);
      throw error;
    }
  }

  /**
   * Get weekly payout data
   */
  static async getWeeklyPayoutData(ambassadorId: string, weekStart: Date, weekEnd: Date) {
    logger.log('💵 AmbassadorService: Getting weekly payout data:', {
      ambassadorId,
      weekStart,
      weekEnd,
    });

    try {
      const commissions = await AmbassadorDAL.getCommissions(ambassadorId, {
        status: 'pending',
        startDate: weekStart,
        endDate: weekEnd,
      });

      const totalCommissions = commissions.reduce(
        (sum, c) => sum + parseFloat(c.commission.commissionAmount.toString()),
        0
      );

      return {
        commissionCount: commissions.length,
        totalCommissions,
        commissions,
      };
    } catch (error) {
      logger.error('❌ AmbassadorService: Error getting weekly payout data:', error);
      throw error;
    }
  }
}

