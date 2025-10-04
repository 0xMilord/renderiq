import { db } from '@/lib/db';
import { userSubscriptions, subscriptionPlans, userCredits } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export class BillingDAL {
  /**
   * Get user's active subscription with plan details
   */
  static async getUserSubscription(userId: string) {
    console.log('💳 BillingDAL: Getting user subscription:', userId);
    
    try {
      const result = await db
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

      if (!result || result.length === 0) {
        console.log('❌ BillingDAL: No active subscription found');
        return null;
      }

      console.log('✅ BillingDAL: Subscription found:', result[0].plan?.name);
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
    console.log('🔍 BillingDAL: Checking if user is pro:', userId);
    
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || !subscription.plan) {
        console.log('❌ BillingDAL: User is not pro');
        return false;
      }

      // Check if subscription is active and not past due
      const isActive = subscription.subscription.status === 'active';
      const isPeriodValid = new Date(subscription.subscription.currentPeriodEnd) > new Date();
      
      const isPro = isActive && isPeriodValid;
      console.log(`✅ BillingDAL: User pro status: ${isPro}`);
      
      return isPro;
    } catch (error) {
      console.error('❌ BillingDAL: Error checking pro status:', error);
      return false;
    }
  }

  /**
   * Get user credits with subscription info
   */
  static async getUserCreditsWithReset(userId: string) {
    console.log('💰 BillingDAL: Getting user credits with reset info:', userId);
    
    try {
      const [credits] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (!credits) {
        console.log('❌ BillingDAL: User credits not found');
        return null;
      }

      // Get subscription to calculate next reset date
      const subscription = await this.getUserSubscription(userId);
      
      const resetDate = subscription?.subscription.currentPeriodEnd 
        ? new Date(subscription.subscription.currentPeriodEnd)
        : null;

      console.log('✅ BillingDAL: Credits found:', credits.balance, 'Reset:', resetDate);
      
      return {
        ...credits,
        nextResetDate: resetDate,
        isPro: !!subscription,
        plan: subscription?.plan,
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
    console.log('📋 BillingDAL: Getting subscription plans');
    
    try {
      const plans = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.price);

      console.log(`✅ BillingDAL: Found ${plans.length} plans`);
      return plans;
    } catch (error) {
      console.error('❌ BillingDAL: Error getting plans:', error);
      throw error;
    }
  }
}

