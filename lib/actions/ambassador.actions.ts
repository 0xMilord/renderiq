'use server';

import { AmbassadorDAL } from '@/lib/dal/ambassador';
import { AmbassadorService, type AmbassadorApplicationData } from '@/lib/services/ambassador.service';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';
import { revalidatePath } from 'next/cache';

/**
 * Apply for ambassador program
 */
export async function applyForAmbassadorAction(applicationData: AmbassadorApplicationData) {
  logger.log('📝 AmbassadorAction: Processing application');

  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const result = await AmbassadorService.applyForAmbassador(user.id, applicationData);

    if (result.success) {
      revalidatePath('/dashboard/ambassador');
      revalidatePath('/ambassador');
    }

    return result;
  } catch (error) {
    logger.error('❌ AmbassadorAction: Error processing application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit application',
    };
  }
}

/**
 * Get ambassador status for current user
 */
export async function getAmbassadorStatusAction() {
  logger.log('🔍 AmbassadorAction: Getting ambassador status');

  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const ambassadorData = await AmbassadorDAL.getAmbassadorByUserId(user.id);

    if (!ambassadorData) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: ambassadorData.ambassador,
    };
  } catch (error) {
    logger.error('❌ AmbassadorAction: Error getting ambassador status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get ambassador status',
    };
  }
}

/**
 * Get ambassador dashboard data
 * Optimized with parallel data fetching
 */
export async function getAmbassadorDashboardAction() {
  logger.log('📊 AmbassadorAction: Getting ambassador dashboard');

  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const ambassadorData = await AmbassadorDAL.getAmbassadorByUserId(user.id);

    if (!ambassadorData) {
      return {
        success: false,
        error: 'You are not an ambassador',
      };
    }

    const ambassador = ambassadorData.ambassador;

    // ✅ OPTIMIZED: Fetch all data in parallel for better performance
    const [stats, links, referrals, commissions, payouts, volumeTier] = await Promise.all([
      AmbassadorService.getAmbassadorStats(ambassador.id),
      AmbassadorDAL.getAmbassadorLinks(ambassador.id),
      AmbassadorDAL.getReferrals(ambassador.id),
      AmbassadorDAL.getCommissions(ambassador.id),
      AmbassadorDAL.getPayouts(ambassador.id),
      AmbassadorService.calculateVolumeTier(ambassador.totalReferrals),
    ]);

    return {
      success: true,
      data: {
        ambassador,
        stats,
        links,
        referrals,
        commissions,
        payouts,
        volumeTier,
      },
    };
  } catch (error) {
    logger.error('❌ AmbassadorAction: Error getting dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard data',
    };
  }
}

/**
 * Create custom tracking link
 */
export async function createCustomLinkAction(campaignName?: string, description?: string) {
  logger.log('🔗 AmbassadorAction: Creating custom link');

  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const ambassadorData = await AmbassadorDAL.getAmbassadorByUserId(user.id);

    if (!ambassadorData) {
      return {
        success: false,
        error: 'You are not an ambassador',
      };
    }

    const ambassador = ambassadorData.ambassador;

    if (ambassador.status !== 'active') {
      return {
        success: false,
        error: 'Your ambassador account is not active',
      };
    }

    const result = await AmbassadorService.createCustomLink(
      ambassador.id,
      campaignName,
      description
    );

    if (result.success) {
      revalidatePath('/dashboard/ambassador');
    }

    return result;
  } catch (error) {
    logger.error('❌ AmbassadorAction: Error creating custom link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create custom link',
    };
  }
}

/**
 * Get ambassador stats
 */
export async function getAmbassadorStatsAction() {
  logger.log('📊 AmbassadorAction: Getting ambassador stats');

  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const ambassadorData = await AmbassadorDAL.getAmbassadorByUserId(user.id);

    if (!ambassadorData) {
      return {
        success: false,
        error: 'You are not an ambassador',
      };
    }

    const stats = await AmbassadorService.getAmbassadorStats(ambassadorData.ambassador.id);

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    logger.error('❌ AmbassadorAction: Error getting stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
  }
}

/**
 * Get commission history
 */
export async function getCommissionHistoryAction(filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  logger.log('💰 AmbassadorAction: Getting commission history');

  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const ambassadorData = await AmbassadorDAL.getAmbassadorByUserId(user.id);

    if (!ambassadorData) {
      return {
        success: false,
        error: 'You are not an ambassador',
      };
    }

    const commissions = await AmbassadorDAL.getCommissions(ambassadorData.ambassador.id, filters);

    return {
      success: true,
      data: commissions,
    };
  } catch (error) {
    logger.error('❌ AmbassadorAction: Error getting commission history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get commission history',
    };
  }
}

/**
 * Get payout history
 */
export async function getPayoutHistoryAction() {
  logger.log('💵 AmbassadorAction: Getting payout history');

  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const ambassadorData = await AmbassadorDAL.getAmbassadorByUserId(user.id);

    if (!ambassadorData) {
      return {
        success: false,
        error: 'You are not an ambassador',
      };
    }

    const payouts = await AmbassadorDAL.getPayouts(ambassadorData.ambassador.id);

    return {
      success: true,
      data: payouts,
    };
  } catch (error) {
    logger.error('❌ AmbassadorAction: Error getting payout history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payout history',
    };
  }
}

/**
 * Get referral list
 */
export async function getReferralListAction() {
  logger.log('👥 AmbassadorAction: Getting referral list');

  try {
    const { user } = await getCachedUser();

    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const ambassadorData = await AmbassadorDAL.getAmbassadorByUserId(user.id);

    if (!ambassadorData) {
      return {
        success: false,
        error: 'You are not an ambassador',
      };
    }

    const referrals = await AmbassadorDAL.getReferrals(ambassadorData.ambassador.id);

    return {
      success: true,
      data: referrals,
    };
  } catch (error) {
    logger.error('❌ AmbassadorAction: Error getting referral list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get referral list',
    };
  }
}

