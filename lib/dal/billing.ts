import { db } from '@/lib/db';
import { userSubscriptions, subscriptionPlans, userCredits, creditTransactions, paymentOrders } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
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
      
      // Get payment method from most recent completed payment order for this subscription
      let paymentMethod = null;
      if (result[0].subscription.razorpaySubscriptionId) {
        const [paymentOrder] = await db
          .select()
          .from(paymentOrders)
          .where(
            and(
              eq(paymentOrders.userId, userId),
              eq(paymentOrders.razorpaySubscriptionId, result[0].subscription.razorpaySubscriptionId),
              eq(paymentOrders.status, 'completed')
            )
          )
          .orderBy(desc(paymentOrders.createdAt))
          .limit(1);
        
        if (paymentOrder?.metadata?.paymentMethod) {
          paymentMethod = paymentOrder.metadata.paymentMethod;
        }
      }
      
      return {
        subscription: result[0].subscription,
        plan: result[0].plan,
        paymentMethod,
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
   * Get monthly credits earned and spent for a user within a billing period
   */
  static async getMonthlyCredits(userId: string, periodStart: Date, periodEnd: Date) {
    logger.log('💰 BillingDAL: Getting monthly credits:', { userId, periodStart, periodEnd });
    
    try {
      const [earnedResult] = await db
        .select({
          total: sql<number>`COALESCE(SUM(CASE WHEN ${creditTransactions.type} IN ('earned', 'bonus', 'refund') THEN ${creditTransactions.amount} ELSE 0 END), 0)`,
        })
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.userId, userId),
            gte(creditTransactions.createdAt, periodStart),
            lte(creditTransactions.createdAt, periodEnd)
          )
        );

      const [spentResult] = await db
        .select({
          total: sql<number>`COALESCE(SUM(CASE WHEN ${creditTransactions.type} = 'spent' THEN ABS(${creditTransactions.amount}) ELSE 0 END), 0)`,
        })
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.userId, userId),
            gte(creditTransactions.createdAt, periodStart),
            lte(creditTransactions.createdAt, periodEnd)
          )
        );

      const monthlyEarned = Number(earnedResult?.total || 0);
      const monthlySpent = Number(spentResult?.total || 0);

      logger.log(`✅ BillingDAL: Monthly credits - Earned: ${monthlyEarned}, Spent: ${monthlySpent}`);
      
      return {
        monthlyEarned,
        monthlySpent,
      };
    } catch (error) {
      console.error('❌ BillingDAL: Error getting monthly credits:', error);
      return {
        monthlyEarned: 0,
        monthlySpent: 0,
      };
    }
  }

  /**
   * Get user credits with reset info and monthly usage
   */
  static async getUserCreditsWithResetAndMonthly(userId: string) {
    logger.log('💰 BillingDAL: Getting user credits with reset and monthly info:', userId);
    
    try {
      // Get subscription to access currentPeriodStart
      const subscription = await this.getUserSubscription(userId);
      
      // Get credits data
      const creditsData = await this.getUserCreditsWithReset(userId);
      
      if (!creditsData) {
        return null;
      }

      // Calculate monthly credits if user has an active subscription with period dates
      let monthlyEarned = 0;
      let monthlySpent = 0;
      
      if (subscription?.subscription?.currentPeriodStart && subscription?.subscription?.currentPeriodEnd) {
        const periodStart = new Date(subscription.subscription.currentPeriodStart);
        const periodEnd = new Date(subscription.subscription.currentPeriodEnd);
        
        const monthlyCredits = await this.getMonthlyCredits(userId, periodStart, periodEnd);
        monthlyEarned = monthlyCredits.monthlyEarned;
        monthlySpent = monthlyCredits.monthlySpent;
      }

      return {
        ...creditsData,
        monthlyEarned,
        monthlySpent,
      };
    } catch (error) {
      console.error('❌ BillingDAL: Error getting credits with monthly:', error);
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

  /**
   * ✅ BATCHED: Get all user billing stats in a single optimized query
   * Combines credits, subscription, and pro status to prevent N+1 queries
   */
  static async getUserBillingStats(userId: string) {
    logger.log('💰 BillingDAL: Getting batched billing stats for user:', userId);
    
    try {
      // Get credits with active subscription info in one query
      const [creditsResult] = await db
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

      if (!creditsResult || !creditsResult.credits) {
        logger.log('❌ BillingDAL: User credits not found');
        return {
          credits: null,
          subscription: null,
          isPro: false,
        };
      }

      // Get full subscription details (including pending, etc.) in parallel
      // This uses the existing optimized method
      const subscription = await this.getUserSubscription(userId);

      // Calculate isPro from subscription
      let isPro = false;
      if (subscription?.subscription && subscription?.plan) {
        const isActive = subscription.subscription.status === 'active';
        const isPeriodValid = new Date(subscription.subscription.currentPeriodEnd) > new Date();
        isPro = isActive && isPeriodValid;
      }

      const resetDate = creditsResult.subscription?.currentPeriodEnd 
        ? new Date(creditsResult.subscription.currentPeriodEnd)
        : subscription?.subscription?.currentPeriodEnd
        ? new Date(subscription.subscription.currentPeriodEnd)
        : null;

      logger.log('✅ BillingDAL: Batched billing stats retrieved', {
        credits: creditsResult.credits.balance,
        hasSubscription: !!subscription,
        isPro,
      });

      return {
        credits: {
          ...creditsResult.credits,
          nextResetDate: resetDate,
          plan: creditsResult.plan || subscription?.plan,
        },
        subscription: subscription || {
          subscription: creditsResult.subscription,
          plan: creditsResult.plan,
          paymentMethod: null,
        },
        isPro,
      };
    } catch (error) {
      console.error('❌ BillingDAL: Error getting batched billing stats:', error);
      throw error;
    }
  }
}

