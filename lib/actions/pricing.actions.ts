'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { creditPackages, subscriptionPlans } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

/**
 * Get all active credit packages
 */
export async function getCreditPackagesAction() {
  try {
    logger.log('📦 PricingAction: Fetching credit packages');

    const packages = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(creditPackages.displayOrder, desc(creditPackages.createdAt));

    return {
      success: true,
      data: packages,
    };
  } catch (error) {
    logger.error('❌ PricingAction: Error fetching credit packages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch credit packages',
    };
  }
}

/**
 * Get all active subscription plans
 */
export async function getSubscriptionPlansAction() {
  try {
    logger.log('📋 PricingAction: Fetching subscription plans');

    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(desc(subscriptionPlans.createdAt));

    return {
      success: true,
      data: plans,
    };
  } catch (error) {
    logger.error('❌ PricingAction: Error fetching subscription plans:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch subscription plans',
    };
  }
}

/**
 * Get user's current credit balance
 */
export async function getUserCreditsAction() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    logger.log('💰 PricingAction: Fetching user credits:', user.id);

    const { userCredits } = await import('@/lib/db/schema');
    const { BillingDAL } = await import('@/lib/dal/billing');

    const credits = await BillingDAL.getUserCreditsWithReset(user.id);

    if (!credits) {
      return {
        success: true,
        data: {
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      };
    }

    return {
      success: true,
      data: credits,
    };
  } catch (error) {
    logger.error('❌ PricingAction: Error fetching user credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user credits',
    };
  }
}

/**
 * Get a specific credit package by ID
 */
export async function getCreditPackageAction(packageId: string) {
  try {
    logger.log('📦 PricingAction: Fetching credit package:', packageId);

    const [packageData] = await db
      .select()
      .from(creditPackages)
      .where(and(eq(creditPackages.id, packageId), eq(creditPackages.isActive, true)))
      .limit(1);

    if (!packageData) {
      return {
        success: false,
        error: 'Credit package not found',
      };
    }

    return {
      success: true,
      data: packageData,
    };
  } catch (error) {
    logger.error('❌ PricingAction: Error fetching credit package:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch credit package',
    };
  }
}

/**
 * Get a specific subscription plan by ID
 */
export async function getSubscriptionPlanAction(planId: string) {
  try {
    logger.log('📋 PricingAction: Fetching subscription plan:', planId);

    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.isActive, true)))
      .limit(1);

    if (!plan) {
      return {
        success: false,
        error: 'Subscription plan not found',
      };
    }

    return {
      success: true,
      data: plan,
    };
  } catch (error) {
    logger.error('❌ PricingAction: Error fetching subscription plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch subscription plan',
    };
  }
}

