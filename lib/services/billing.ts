import Stripe from 'stripe';
import { db } from '@/lib/db';
import { userSubscriptions, subscriptionPlans, userCredits, creditTransactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export class BillingService {
  static async createCustomer(userId: string, email: string, name?: string) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      return { success: true, customerId: customer.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create customer',
      };
    }
  }

  static async createSubscription(
    userId: string,
    planId: string,
    customerId: string,
    paymentMethodId?: string
  ) {
    try {
      const plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1);
      if (!plan[0]) {
        return { success: false, error: 'Plan not found' };
      }

      // Create product first
      const product = await stripe.products.create({
        name: plan[0].name,
        description: plan[0].description || undefined,
      });

      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [
          {
            price_data: {
              currency: plan[0].currency.toLowerCase(),
              product: product.id,
              unit_amount: Math.round(parseFloat(plan[0].price) * 100),
              recurring: {
                interval: plan[0].interval,
              },
            },
          },
        ],
        metadata: {
          userId,
          planId,
        },
        expand: ['latest_invoice.payment_intent'],
      };

      if (paymentMethodId) {
        subscriptionData.default_payment_method = paymentMethodId;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);

      // Create subscription record in database
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + (plan[0].interval === 'year' ? 12 : 1));

      await db.insert(userSubscriptions).values({
        userId,
        planId,
        status: 'active',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });

      // Add credits to user account
      await this.addCredits(userId, plan[0].creditsPerMonth, 'earned', `Monthly credits for ${plan[0].name} plan`);

      return { success: true, subscriptionId: subscription.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription',
      };
    }
  }

  static async cancelSubscription(subscriptionId: string) {
    try {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      await db
        .update(userSubscriptions)
        .set({ 
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.stripeSubscriptionId, subscriptionId));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  }

  static async getSubscription(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
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
      // Get or create user credits record
      let userCredit = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
      
      if (!userCredit[0]) {
        await db.insert(userCredits).values({
          userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        });
        userCredit = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
      }

      const currentBalance = userCredit[0].balance;
      const newBalance = currentBalance + amount;

      // Update credits balance
      await db
        .update(userCredits)
        .set({
          balance: newBalance,
          totalEarned: type === 'earned' || type === 'bonus' ? userCredit[0].totalEarned + amount : userCredit[0].totalEarned,
          totalSpent: type === 'spent' ? userCredit[0].totalSpent + Math.abs(amount) : userCredit[0].totalSpent,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));

      // Create transaction record
      await db.insert(creditTransactions).values({
        userId,
        amount,
        type,
        description,
        referenceId,
        referenceType,
      });

      return { success: true, newBalance };
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

      return await this.addCredits(userId, -amount, 'spent', description, referenceId, referenceType);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deduct credits',
      };
    }
  }

  static async getUserCredits(userId: string) {
    try {
      const userCredit = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
      
      if (!userCredit[0]) {
        // Create initial credits record
        await db.insert(userCredits).values({
          userId,
          balance: parseInt(process.env.DEFAULT_FREE_CREDITS || '10'),
          totalEarned: parseInt(process.env.DEFAULT_FREE_CREDITS || '10'),
          totalSpent: 0,
        });
        
        return {
          success: true,
          credits: {
            balance: parseInt(process.env.DEFAULT_FREE_CREDITS || '10'),
            totalEarned: parseInt(process.env.DEFAULT_FREE_CREDITS || '10'),
            totalSpent: 0,
          },
        };
      }

      return { success: true, credits: userCredit[0] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user credits',
      };
    }
  }

  static async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook handling failed',
      };
    }
  }

  private static async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      const subscription = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.stripeSubscriptionId, invoice.subscription as string))
        .limit(1);

      if (subscription[0]) {
        // Add monthly credits
        const plan = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, subscription[0].planId))
          .limit(1);

        if (plan[0]) {
          await this.addCredits(
            subscription[0].userId,
            plan[0].creditsPerMonth,
            'earned',
            `Monthly credits for ${plan[0].name} plan`
          );
        }
      }
    }
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      await db
        .update(userSubscriptions)
        .set({ status: 'past_due', updatedAt: new Date() })
        .where(eq(userSubscriptions.stripeSubscriptionId, invoice.subscription as string));
    }
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await db
      .update(userSubscriptions)
      .set({
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await db
      .update(userSubscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
  }
}
