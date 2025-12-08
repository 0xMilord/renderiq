'use server';

import { getCachedUser } from '@/lib/services/auth-cache';
import { BillingDAL } from '@/lib/dal/billing';
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
      .orderBy(subscriptionPlans.price); // Order by price to show Free, Starter, Pro, Enterprise

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
    const { user } = await getCachedUser();

    if (!user) {
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

/**
 * ✅ BATCHED: Get all pricing page data in a single optimized call
 * Fetches plans, packages, and user billing stats in parallel
 * Prevents N+1 queries and sequential auth calls
 */
export async function getPricingPageDataAction() {
  try {
    logger.log('📋 PricingAction: Fetching all pricing page data (batched)');

    // ✅ OPTIMIZED: Fetch all public data and user data in parallel
    // Public data (plans/packages) can load immediately, user data loads in parallel
    const [plansResult, packagesResult, userResult] = await Promise.all([
      // Public data - no auth required
      db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.price),
      db
        .select()
        .from(creditPackages)
        .where(eq(creditPackages.isActive, true))
        .orderBy(creditPackages.displayOrder, desc(creditPackages.createdAt)),
      // User data - fetch in parallel (non-blocking)
      getCachedUser().catch(() => ({ user: null })),
    ]);

    const { user } = userResult as { user: any };

    // ✅ OPTIMIZED: Fetch billing stats only if user exists
    let userCredits = null;
    let userSubscription = null;

    if (user) {
      try {
        // ✅ FIXED: Use optimized batched query (no extra getUserSubscription call)
        const billingStats = await BillingDAL.getUserBillingStats(user.id);
        userCredits = billingStats.credits;
        // ✅ FIXED: Return full subscription object (with subscription and plan properties)
        userSubscription = billingStats.subscription || null;
      } catch (error) {
        // Silently fail - page can still show plans/packages without user data
        logger.error('❌ PricingAction: Error fetching user billing stats:', error);
      }
    }

    return {
      success: true,
      data: {
        plans: plansResult,
        creditPackages: packagesResult,
        userCredits,
        userSubscription,
      },
    };
  } catch (error) {
    logger.error('❌ PricingAction: Error fetching pricing page data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pricing data',
    };
  }
}

