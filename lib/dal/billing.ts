import { db } from '@/lib/db';
import { userSubscriptions, subscriptionPlans, userCredits } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export class BillingDAL {
  /**
   * Get user's subscription with plan details
   * Returns the most recent subscription (prioritizes active, then pending, then others)
   */
  static async getUserSubscription(userId: string) {
    logger.log('💳 BillingDAL: Getting user subscription:', userId);
    
    try {
      // First try to get active subscription
      let result = await db
        .select({
          subscription: userSubscriptions,
          plan: subscriptionPlans,
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, 'active')
          )
        )
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);

      // If no active subscription, get pending subscription
      if (!result || result.length === 0) {
        logger.log('💳 BillingDAL: No active subscription, checking for pending...');
        result = await db
          .select({
            subscription: userSubscriptions,
            plan: subscriptionPlans,
          })
          .from(userSubscriptions)
          .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
          .where(
            and(
              eq(userSubscriptions.userId, userId),
              eq(userSubscriptions.status, 'pending')
            )
          )
          .orderBy(desc(userSubscriptions.createdAt))
          .limit(1);
      }

      // If still no subscription, get the most recent one regardless of status
      if (!result || result.length === 0) {
        logger.log('💳 BillingDAL: No active or pending subscription, getting most recent...');
        result = await db
          .select({
            subscription: userSubscriptions,
            plan: subscriptionPlans,
          })
          .from(userSubscriptions)
          .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
          .where(eq(userSubscriptions.userId, userId))
          .orderBy(desc(userSubscriptions.createdAt))
          .limit(1);
      }

      if (!result || result.length === 0) {
        logger.log('❌ BillingDAL: No subscription found');
        return null;
      }

      logger.log('✅ BillingDAL: Subscription found:', result[0].plan?.name, 'Status:', result[0].subscription.status);
      return {
        subscription: result[0].subscription,
        plan: result[0].plan,
      };
    } catch (error) {
      console.error('❌ BillingDAL: Error getting subscription:', error);
      throw error;
    }
  }

  /**
   * Check if user has an active pro subscription
   */
  static async isUserPro(userId: string): Promise<boolean> {
    logger.log('🔍 BillingDAL: Checking if user is pro:', userId);
    
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || !subscription.plan) {
        logger.log('❌ BillingDAL: User is not pro');
        return false;
      }

      // Check if subscription is active and not past due
      const isActive = subscription.subscription.status === 'active';
      const isPeriodValid = new Date(subscription.subscription.currentPeriodEnd) > new Date();
      
      const isPro = isActive && isPeriodValid;
      logger.log(`✅ BillingDAL: User pro status: ${isPro}`);
      
      return isPro;
    } catch (error) {
      console.error('❌ BillingDAL: Error checking pro status:', error);
      return false;
    }
  }

  /**
   * Get user credits with subscription info
   * ✅ OPTIMIZED: Single query with JOINs instead of two separate queries
   */
  static async getUserCreditsWithReset(userId: string) {
    logger.log('💰 BillingDAL: Getting user credits with reset info:', userId);
    
    try {
      const [result] = await db
        .select({
          credits: userCredits,
          subscription: userSubscriptions,
          plan: subscriptionPlans,
        })
        .from(userCredits)
        .leftJoin(
          userSubscriptions,
          and(
            eq(userCredits.userId, userSubscriptions.userId),
            eq(userSubscriptions.status, 'active')
          )
        )
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userCredits.userId, userId))
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);

      if (!result || !result.credits) {
        logger.log('❌ BillingDAL: User credits not found');
        return null;
      }

      const resetDate = result.subscription?.currentPeriodEnd 
        ? new Date(result.subscription.currentPeriodEnd)
        : null;

      logger.log('✅ BillingDAL: Credits found:', result.credits.balance, 'Reset:', resetDate);
      
      return {
        ...result.credits,
        nextResetDate: resetDate,
        isPro: !!result.subscription,
        plan: result.plan,
      };
    } catch (error) {
      console.error('❌ BillingDAL: Error getting credits with reset:', error);
      throw error;
    }
  }

  /**
   * Get all subscription plans
   */
  static async getSubscriptionPlans() {
    logger.log('📋 BillingDAL: Getting subscription plans');
    
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.price);

      logger.log(`✅ BillingDAL: Found ${plans.length} plans`);
      return plans;
    } catch (error) {
      console.error('❌ BillingDAL: Error getting plans:', error);
      throw error;
    }
  }
}

