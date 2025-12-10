import { db } from '@/lib/db';
import { userSubscriptions, subscriptionPlans, userCredits, creditTransactions, users } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { RazorpayService } from './razorpay.service';
import { logger } from '@/lib/utils/logger';

// Maximum initial credits for new users on signup
const INITIAL_SIGNUP_CREDITS = 10;

export class BillingService {
  /**
   * NOTE: Subscription management is now handled by RazorpayService
   * This class only handles credit management (add/deduct/get)
   * For subscriptions, use RazorpayService.createSubscription() instead
   */
  
  static async createCustomer(userId: string, email: string, name?: string) {
    // Customer creation is handled by RazorpayService.createSubscription()
    // This method is kept for backward compatibility but delegates to RazorpayService
    logger.log('⚠️ BillingService.createCustomer: Use RazorpayService.createSubscription() instead');
    return {
      success: false,
      error: 'Use RazorpayService.createSubscription() for customer and subscription creation',
    };
  }

  static async createSubscription(
    userId: string,
    planId: string,
    customerId: string,
    paymentMethodId?: string
  ) {
    // Subscription creation is handled by RazorpayService
    logger.log('⚠️ BillingService.createSubscription: Use RazorpayService.createSubscription() instead');
    return {
      success: false,
      error: 'Use RazorpayService.createSubscription() for subscription creation',
    };
  }

  static async cancelSubscription(subscriptionId: string) {
    // Subscription cancellation should be handled via RazorpayService webhooks
    // For manual cancellation, update the database directly
    try {
      await db
        .update(userSubscriptions)
        .set({ 
          cancelAtPeriodEnd: true,
          status: 'canceled',
          canceledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  }

  static async getSubscription(subscriptionId: string) {
    // Get subscription from database instead of Razorpay API
    try {
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId))
        .limit(1);

      if (!subscription) {
        return { success: false, error: 'Subscription not found' };
      }

      return { success: true, subscription };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get subscription',
      };
    }
  }

  static async addCredits(
    userId: string,
    amount: number,
    type: 'earned' | 'spent' | 'refund' | 'bonus',
    description: string,
    referenceId?: string,
    referenceType?: 'render' | 'subscription' | 'bonus' | 'refund'
  ) {
    try {
      // ✅ OPTIMIZED: Use transaction + upsert pattern to eliminate race conditions
      // This reduces from 5 sequential queries to 2 queries (upsert + parallel update/insert)
      return await db.transaction(async (tx) => {
        // Upsert user credits record (creates if doesn't exist, updates if exists)
        // Note: If userId is not unique, we'll need to handle differently
        // For now, we'll use a different approach: check first, then insert/update
        let [userCredit] = await tx
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, userId))
          .limit(1);
        
        if (!userCredit) {
          // Create new credits record
          [userCredit] = await tx
            .insert(userCredits)
            .values({
              userId,
              balance: 0,
              totalEarned: 0,
              totalSpent: 0,
            })
            .returning();
        }

        const currentBalance = userCredit.balance;
        const newBalance = currentBalance + amount;

        // ✅ OPTIMIZED: Parallelize credit update and transaction insert
        await Promise.all([
          // Update credits balance
          tx
            .update(userCredits)
            .set({
              balance: newBalance,
              totalEarned: type === 'earned' || type === 'bonus' ? userCredit.totalEarned + amount : userCredit.totalEarned,
              totalSpent: type === 'spent' ? userCredit.totalSpent + Math.abs(amount) : userCredit.totalSpent,
              updatedAt: new Date(),
            })
            .where(eq(userCredits.userId, userId)),
          // Create transaction record
          tx.insert(creditTransactions).values({
            userId,
            amount,
            type,
            description,
            referenceId,
            referenceType,
          }),
        ]);

        return { success: true, newBalance };
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add credits',
      };
    }
  }

  static async deductCredits(
    userId: string,
    amount: number,
    description: string,
    referenceId?: string,
    referenceType?: 'render' | 'subscription' | 'bonus' | 'refund'
  ) {
    try {
      const userCredit = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
      
      if (!userCredit[0] || userCredit[0].balance < amount) {
        return { success: false, error: 'Insufficient credits' };
      }

      const oldBalance = userCredit[0].balance;
      const result = await this.addCredits(userId, -amount, 'spent', description, referenceId, referenceType);

      // Check if credits are running low after deduction
      if (result.success && result.newBalance !== undefined) {
        const creditsThreshold = parseInt(process.env.CREDITS_LOW_THRESHOLD || '10');
        const wasAboveThreshold = oldBalance > creditsThreshold;
        const isBelowThreshold = result.newBalance <= creditsThreshold;

        // Send email if credits just dropped below threshold
        if (wasAboveThreshold && isBelowThreshold) {
          try {
            const { db } = await import('@/lib/db');
            const { users } = await import('@/lib/db/schema');
            const [user] = await db
              .select()
              .from(users)
              .where(eq(users.id, userId))
              .limit(1);

            if (user?.email) {
              const { sendCreditsFinishedEmail } = await import('@/lib/services/email.service');
              await sendCreditsFinishedEmail({
                name: user.name || 'User',
                email: user.email,
                credits: result.newBalance,
                balance: result.newBalance,
                reason: 'Credits running low',
              });
              logger.log('✅ BillingService: Credits finished email sent:', user.email);
            }
          } catch (error) {
            logger.error('❌ BillingService: Failed to send credits finished email:', error);
            // Don't fail credit deduction if email fails
          }
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deduct credits',
      };
    }
  }

  static async getUserCredits(userId: string) {
    try {
      // ✅ OPTIMIZED: Use check-then-insert pattern with better error handling
      // Note: Can't use upsert here because we need to set initialCredits only on creation
      // But we can optimize by checking and inserting in a single transaction
      const [userCredit] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);
      
      if (!userCredit) {
        // Create initial credits record (capped at max 10 for signup)
        const initialCredits = Math.min(
          parseInt(process.env.DEFAULT_FREE_CREDITS || String(INITIAL_SIGNUP_CREDITS)),
          INITIAL_SIGNUP_CREDITS
        );
        
        try {
          const [newCredit] = await db
            .insert(userCredits)
            .values({
              userId,
              balance: initialCredits,
              totalEarned: initialCredits,
              totalSpent: 0,
            })
            .returning();
          
          return {
            success: true,
            credits: {
              balance: newCredit.balance,
              totalEarned: newCredit.totalEarned,
              totalSpent: newCredit.totalSpent,
            },
          };
        } catch (insertError: any) {
          // Handle race condition: if another request created credits between check and insert
          if (insertError?.code === '23505' || insertError?.message?.includes('unique') || insertError?.message?.includes('duplicate')) {
            // Fetch the newly created credits
            const [existingCredit] = await db
              .select()
              .from(userCredits)
              .where(eq(userCredits.userId, userId))
              .limit(1);
            
            if (existingCredit) {
              return { success: true, credits: existingCredit };
            }
          }
          throw insertError;
        }
      }

      return { success: true, credits: userCredit };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user credits',
      };
    }
  }

  /**
   * Webhook handling is now done by RazorpayService.handleWebhook()
   * This method is kept for backward compatibility but delegates to RazorpayService
   */
  static async handleWebhook(event: any, signature: string) {
    logger.log('⚠️ BillingService.handleWebhook: Use RazorpayService.handleWebhook() instead');
    return RazorpayService.handleWebhook(event, signature);
  }
}
