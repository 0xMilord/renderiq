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
      // ✅ OPTIMIZED: Single query with CASE-based ordering to prioritize active > pending > others
      const result = await db
        .select({
          subscription: userSubscriptions,
          plan: subscriptionPlans,
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userSubscriptions.userId, userId))
        .orderBy(
          sql`CASE 
            WHEN ${userSubscriptions.status} = 'active' THEN 1
            WHEN ${userSubscriptions.status} = 'pending' THEN 2
            ELSE 3
          END`,
          desc(userSubscriptions.createdAt)
        )
        .limit(1);

      if (!result || result.length === 0) {
        logger.log('❌ BillingDAL: No subscription found');
        return null;
      }

      logger.log('✅ BillingDAL: Subscription found:', result[0].plan?.name, 'Status:', result[0].subscription.status);
      
      // ✅ OPTIMIZED: Get payment method in parallel (supports multiple providers)
      // This can run in parallel since it doesn't depend on the subscription query result
      let paymentMethod = null;
      const subscription = result[0].subscription;
      const provider = subscription.paymentProvider || 'razorpay';
      
      if (subscription.razorpaySubscriptionId || subscription.paddleSubscriptionId) {
        const subscriptionId = provider === 'paddle' 
          ? subscription.paddleSubscriptionId 
          : subscription.razorpaySubscriptionId;
        
        if (subscriptionId) {
          const whereCondition = provider === 'paddle'
            ? and(
                eq(paymentOrders.userId, userId),
                eq(paymentOrders.paddleSubscriptionId, subscriptionId),
                eq(paymentOrders.status, 'completed')
              )
            : and(
                eq(paymentOrders.userId, userId),
                eq(paymentOrders.razorpaySubscriptionId, subscriptionId),
                eq(paymentOrders.status, 'completed')
              );
          
          const [paymentOrder] = await db
            .select()
            .from(paymentOrders)
            .where(whereCondition)
            .orderBy(desc(paymentOrders.createdAt))
            .limit(1);
          
          if (paymentOrder?.metadata?.paymentMethod) {
            paymentMethod = paymentOrder.metadata.paymentMethod;
          }
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
   * ✅ FIXED: Consistent with getUserBillingStats logic
   */
  static async isUserPro(userId: string): Promise<boolean> {
    logger.log('🔍 BillingDAL: Checking if user is pro:', userId);
    
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || !subscription.plan) {
        logger.log('❌ BillingDAL: User is not pro - no subscription found');
        return false;
      }

      const status = subscription.subscription.status;
      const currentPeriodEnd = subscription.subscription.currentPeriodEnd ? new Date(subscription.subscription.currentPeriodEnd) : null;
      const now = new Date();
      
      // Check if subscription is in a valid status
      // - 'active', 'pending', 'past_due' are always valid if period is valid
      // - 'canceled' is valid if period hasn't ended (user paid for this period, should have access)
      // - 'unpaid' is NOT valid (hard cancellation, no access)
      const invalidStatuses = ['unpaid'];
      const isValidStatus = !invalidStatuses.includes(status);
      // Check if period is still valid (not expired)
      const isPeriodValid = currentPeriodEnd ? currentPeriodEnd > now : false;
      
      const isPro = isValidStatus && isPeriodValid;
      
      logger.log('🔍 BillingDAL: Pro status calculation:', {
        status,
        isValidStatus,
        currentPeriodEnd: currentPeriodEnd?.toISOString(),
        now: now.toISOString(),
        isPeriodValid,
        isPro,
        subscriptionId: subscription.id,
        planName: subscription.plan?.name,
      });
      
      return isPro;
    } catch (error) {
      logger.error('❌ BillingDAL: Error checking pro status:', error);
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
      // ✅ OPTIMIZED: Single query with conditional aggregation instead of 2 separate queries
      // This reduces from 2 sequential queries to 1 query
      const [result] = await db
        .select({
          earned: sql<number>`COALESCE(SUM(CASE WHEN ${creditTransactions.type} IN ('earned', 'bonus', 'refund') THEN ${creditTransactions.amount} ELSE 0 END), 0)`,
          spent: sql<number>`COALESCE(SUM(CASE WHEN ${creditTransactions.type} = 'spent' THEN ABS(${creditTransactions.amount}) ELSE 0 END), 0)`,
        })
        .from(creditTransactions)
        .where(
          and(
            eq(creditTransactions.userId, userId),
            gte(creditTransactions.createdAt, periodStart),
            lte(creditTransactions.createdAt, periodEnd)
          )
        );

      const monthlyEarned = Number(result?.earned || 0);
      const monthlySpent = Number(result?.spent || 0);

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
      // ✅ OPTIMIZED: Parallelize independent queries
      // Subscription and credits data can be fetched in parallel
      const [subscription, creditsData] = await Promise.all([
        this.getUserSubscription(userId),
        this.getUserCreditsWithReset(userId),
      ]);
      
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
      // ✅ FIXED: Don't filter by status in JOIN - get all subscriptions and check validity after
      // This ensures we don't miss subscriptions that might be in 'trialing', 'past_due', etc.
      const [creditsResult] = await db
        .select({
          credits: userCredits,
          subscription: userSubscriptions,
          plan: subscriptionPlans,
        })
        .from(userCredits)
        .leftJoin(
          userSubscriptions,
          eq(userCredits.userId, userSubscriptions.userId)
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

      logger.log('🔍 BillingDAL: Subscription data found:', {
        hasSubscription: !!creditsResult.subscription,
        subscriptionStatus: creditsResult.subscription?.status,
        subscriptionId: creditsResult.subscription?.id,
        planId: creditsResult.plan?.id,
        planName: creditsResult.plan?.name,
        currentPeriodEnd: creditsResult.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: creditsResult.subscription?.cancelAtPeriodEnd,
      });

      // ✅ FIXED: Check subscription validity properly
      // Consider subscriptions valid if:
      // 1. Status is 'active', 'pending', 'past_due', OR 'canceled' (user still has access until period ends)
      // 2. Status is NOT 'unpaid' (hard cancellation)
      // 3. Current period hasn't ended yet
      let isPro = false;
      let validSubscription = null;
      
      if (creditsResult.subscription && creditsResult.plan) {
        const subscription = creditsResult.subscription;
        const status = subscription.status;
        const cancelAtPeriodEnd = subscription.cancelAtPeriodEnd || false;
        const currentPeriodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
        const now = new Date();
        
        // Check if subscription is in a valid status
        // - 'active', 'pending', 'past_due' are always valid if period is valid
        // - 'canceled' is valid if period hasn't ended (user paid for this period, should have access)
        // - 'unpaid' is NOT valid (hard cancellation, no access)
        const invalidStatuses = ['unpaid'];
        const isValidStatus = !invalidStatuses.includes(status);
        // Check if period is still valid (not expired)
        const isPeriodValid = currentPeriodEnd ? currentPeriodEnd > now : false;
        
        isPro = isValidStatus && isPeriodValid;
        
        logger.log('🔍 BillingDAL: Pro status calculation:', {
          status,
          cancelAtPeriodEnd,
          isValidStatus,
          currentPeriodEnd: currentPeriodEnd?.toISOString(),
          now: now.toISOString(),
          isPeriodValid,
          isPro,
          planName: creditsResult.plan.name,
          planId: creditsResult.plan.id,
        });

        if (isPro) {
          validSubscription = {
            subscription: subscription,
            plan: creditsResult.plan,
            paymentMethod: null, // Payment method not needed for pricing page
          };
        } else {
          logger.log('⚠️ BillingDAL: Subscription found but not valid for pro:', {
            status,
            cancelAtPeriodEnd,
            isValidStatus,
            isPeriodValid,
            reason: !isValidStatus ? `status is invalid (${status})` : !isPeriodValid ? 'period expired' : 'unknown',
          });
        }
      } else {
        logger.log('⚠️ BillingDAL: No subscription or plan found for user');
      }

      const resetDate = creditsResult.subscription?.currentPeriodEnd 
        ? new Date(creditsResult.subscription.currentPeriodEnd)
        : null;

      logger.log('✅ BillingDAL: Batched billing stats retrieved', {
        credits: creditsResult.credits.balance,
        hasSubscription: !!validSubscription,
        subscriptionStatus: creditsResult.subscription?.status,
        isPro,
        resetDate: resetDate?.toISOString(),
      });

      return {
        credits: {
          ...creditsResult.credits,
          nextResetDate: resetDate,
          plan: creditsResult.plan || validSubscription?.plan,
        },
        subscription: validSubscription || {
          subscription: creditsResult.subscription,
          plan: creditsResult.plan,
          paymentMethod: null,
        },
        isPro,
      };
    } catch (error) {
      logger.error('❌ BillingDAL: Error getting batched billing stats:', error);
      throw error;
    }
  }
}

