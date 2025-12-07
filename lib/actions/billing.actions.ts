'use server';

import { BillingDAL } from '@/lib/dal/billing';
import { BillingService } from '@/lib/services/billing';
import { getCachedUser } from '@/lib/services/auth-cache';
import { logger } from '@/lib/utils/logger';

export async function getUserSubscriptionAction(userId: string) {
  logger.log('💳 BillingAction: Getting user subscription for:', userId);
  
  try {
    const subscription = await BillingDAL.getUserSubscription(userId);
    
    if (!subscription) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: subscription,
    };
  } catch (error) {
    logger.error('❌ BillingAction: Error getting subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get subscription',
    };
  }
}

export async function isUserProAction(userId: string) {
  logger.log('🔍 BillingAction: Checking if user is pro:', userId);
  
  try {
    const isPro = await BillingDAL.isUserPro(userId);
    
    return {
      success: true,
      data: isPro,
    };
  } catch (error) {
    logger.error('❌ BillingAction: Error checking pro status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check pro status',
      data: false,
    };
  }
}

export async function getUserCredits() {
  logger.log('💰 BillingAction: Getting user credits (no userId required)');
  
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      logger.error('❌ BillingAction: No authenticated user');
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const credits = await BillingDAL.getUserCreditsWithResetAndMonthly(user.id);
    
    if (!credits) {
      return {
        success: false,
        error: 'Credits not found',
      };
    }

    return {
      success: true,
      credits: {
        balance: credits.balance,
        totalEarned: credits.totalEarned,
        totalSpent: credits.totalSpent,
        monthlyEarned: credits.monthlyEarned || 0,
        monthlySpent: credits.monthlySpent || 0,
      },
    };
  } catch (error) {
    logger.error('❌ BillingAction: Error getting credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get credits',
    };
  }
}

export async function getUserCreditsWithResetAction(userId: string) {
  logger.log('💰 BillingAction: Getting user credits with reset info for:', userId);
  
  try {
    const credits = await BillingDAL.getUserCreditsWithReset(userId);
    
    if (!credits) {
      return {
        success: false,
        error: 'Credits not found',
      };
    }

    return {
      success: true,
      data: credits,
    };
  } catch (error) {
    logger.error('❌ BillingAction: Error getting credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get credits',
    };
  }
}

export async function getSubscriptionPlansAction() {
  logger.log('📋 BillingAction: Getting subscription plans');
  
  try {
    const plans = await BillingDAL.getSubscriptionPlans();
    
    return {
      success: true,
      data: plans,
    };
  } catch (error) {
    logger.error('❌ BillingAction: Error getting plans:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get plans',
    };
  }
}

export async function addCredits(
  amount: number,
  type: 'earned' | 'spent' | 'refund' | 'bonus',
  description: string,
  userId?: string,
  referenceType?: 'render' | 'subscription' | 'bonus' | 'refund'
) {
  logger.log('💰 BillingAction: Adding credits:', { amount, type, description, userId });
  
  try {
    // If no userId provided, get from auth context
    let finalUserId = userId;
    if (!finalUserId) {
      const { user } = await getCachedUser();
      
      if (!user) {
        logger.error('❌ BillingAction: No authenticated user');
        return {
          success: false,
          error: 'User not authenticated',
        };
      }
      
      finalUserId = user.id;
    }

    const result = await BillingService.addCredits(
      finalUserId,
      amount,
      type,
      description,
      undefined, // referenceId
      referenceType
    );
    
    return result;
  } catch (error) {
    logger.error('❌ BillingAction: Error adding credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add credits',
    };
  }
}

export async function deductCredits(
  amount: number,
  description: string,
  referenceId?: string,
  referenceType?: 'render' | 'subscription' | 'bonus' | 'refund'
) {
  logger.log('💰 BillingAction: Deducting credits:', { amount, description, referenceId, referenceType });
  
  try {
    const { user } = await getCachedUser();
    
    if (!user) {
      logger.error('❌ BillingAction: No authenticated user');
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const result = await BillingService.deductCredits(
      user.id,
      amount,
      description,
      referenceId,
      referenceType
    );
    
    return result;
  } catch (error) {
    logger.error('❌ BillingAction: Error deducting credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deduct credits',
    };
  }
}

/**
 * ✅ BATCHED: Get all user billing stats in a single call
 * Replaces separate calls to getUserCreditsWithReset, getUserSubscription, and isUserPro
 */
export async function getUserBillingStatsAction(userId: string) {
  logger.log('💰 BillingAction: Getting batched billing stats for:', userId);
  
  try {
    const stats = await BillingDAL.getUserBillingStats(userId);
    
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    logger.error('❌ BillingAction: Error getting batched billing stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get billing stats',
    };
  }
}
