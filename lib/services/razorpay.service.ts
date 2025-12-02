import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { paymentOrders, creditPackages, subscriptionPlans, userSubscriptions, userCredits, creditTransactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

// Lazy initialization of Razorpay instance to avoid build-time errors
let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }
    
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  
  return razorpayInstance;
}

export class RazorpayService {
  /**
   * Create a Razorpay order for one-time payment (credit package)
   */
  static async createOrder(
    userId: string,
    creditPackageId: string,
    amount: number,
    currency: string = 'INR'
  ) {
    try {
      logger.log('💳 RazorpayService: Creating order for credit package:', { userId, creditPackageId, amount });

      // Get credit package details
      const [packageData] = await db
        .select()
        .from(creditPackages)
        .where(eq(creditPackages.id, creditPackageId))
        .limit(1);

      if (!packageData) {
        return { success: false, error: 'Credit package not found' };
      }

      // Create order in Razorpay
      const orderOptions = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: currency,
        receipt: `credit_package_${creditPackageId}_${Date.now()}`,
        notes: {
          userId,
          creditPackageId,
          credits: packageData.credits,
          bonusCredits: packageData.bonusCredits,
        },
      };

      const razorpay = getRazorpayInstance();
      const razorpayOrder = await razorpay.orders.create(orderOptions);

      logger.log('✅ RazorpayService: Order created:', razorpayOrder.id);

      // Create payment order record in database
      const [paymentOrder] = await db
        .insert(paymentOrders)
        .values({
          userId,
          type: 'credit_package',
          referenceId: creditPackageId,
          razorpayOrderId: razorpayOrder.id,
          amount: amount.toString(),
          currency,
          status: 'pending',
          metadata: {
            credits: packageData.credits,
            bonusCredits: packageData.bonusCredits,
            packageName: packageData.name,
          },
        })
        .returning();

      return {
        success: true,
        data: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount / 100, // Convert back from paise
          currency: razorpayOrder.currency,
          paymentOrderId: paymentOrder.id,
        },
      };
    } catch (error) {
      logger.error('❌ RazorpayService: Error creating order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order',
      };
    }
  }

  /**
   * Verify payment signature and capture payment
   */
  static async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    try {
      logger.log('🔐 RazorpayService: Verifying payment:', { razorpayOrderId, razorpayPaymentId });

      // Get payment order from database
      const [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.razorpayOrderId, razorpayOrderId))
        .limit(1);

      if (!paymentOrder) {
        return { success: false, error: 'Payment order not found' };
      }

      // Verify signature
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        logger.error('❌ RazorpayService: Invalid payment signature');
        return { success: false, error: 'Invalid payment signature' };
      }

      // Fetch payment details from Razorpay
      const razorpay = getRazorpayInstance();
      const payment = await razorpay.payments.fetch(razorpayPaymentId);

      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        return { success: false, error: `Payment not successful. Status: ${payment.status}` };
      }

      // Update payment order status
      await db
        .update(paymentOrders)
        .set({
          razorpayPaymentId: razorpayPaymentId,
          status: payment.status === 'captured' ? 'completed' : 'processing',
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, paymentOrder.id));

      logger.log('✅ RazorpayService: Payment verified successfully');

      return {
        success: true,
        data: {
          paymentOrderId: paymentOrder.id,
          userId: paymentOrder.userId,
          type: paymentOrder.type,
          referenceId: paymentOrder.referenceId,
          amount: parseFloat(paymentOrder.amount),
        },
      };
    } catch (error) {
      logger.error('❌ RazorpayService: Error verifying payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify payment',
      };
    }
  }

  /**
   * Add credits to user account after successful payment
   */
  static async addCreditsToAccount(
    userId: string,
    creditPackageId: string
  ) {
    try {
      logger.log('💰 RazorpayService: Adding credits to account:', { userId, creditPackageId });

      // Get credit package details
      const [packageData] = await db
        .select()
        .from(creditPackages)
        .where(eq(creditPackages.id, creditPackageId))
        .limit(1);

      if (!packageData) {
        return { success: false, error: 'Credit package not found' };
      }

      const totalCredits = packageData.credits + packageData.bonusCredits;

      // Get or create user credits record
      let [userCredit] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (!userCredit) {
        const [newCredit] = await db
          .insert(userCredits)
          .values({
            userId,
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
          })
          .returning();
        userCredit = newCredit;
      }

      // Update credits balance
      const newBalance = userCredit.balance + totalCredits;
      await db
        .update(userCredits)
        .set({
          balance: newBalance,
          totalEarned: userCredit.totalEarned + totalCredits,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));

      // Create transaction record
      await db.insert(creditTransactions).values({
        userId,
        amount: totalCredits,
        type: 'earned',
        description: `Purchased ${packageData.name} - ${packageData.credits} credits${packageData.bonusCredits > 0 ? ` + ${packageData.bonusCredits} bonus` : ''}`,
        referenceId: creditPackageId,
        referenceType: 'subscription', // Using subscription type for purchased credits
      });

      logger.log('✅ RazorpayService: Credits added successfully:', { totalCredits, newBalance });

      return {
        success: true,
        data: {
          creditsAdded: totalCredits,
          newBalance,
        },
      };
    } catch (error) {
      logger.error('❌ RazorpayService: Error adding credits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add credits',
      };
    }
  }

  /**
   * Create a Razorpay subscription
   */
  static async createSubscription(
    userId: string,
    planId: string,
    customerDetails: {
      name: string;
      email: string;
      contact?: string;
    }
  ) {
    try {
      logger.log('💳 RazorpayService: Creating subscription:', { userId, planId });

      // Get subscription plan details
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);

      if (!plan) {
        return { success: false, error: 'Subscription plan not found' };
      }

      if (!plan.razorpayPlanId) {
        return { success: false, error: 'Razorpay plan ID not configured for this plan' };
      }

      // Create or get Razorpay customer
      const razorpay = getRazorpayInstance();
      let razorpayCustomerId: string;
      try {
        const customers = await razorpay.customers.all({ email: customerDetails.email, count: 1 });
        if (customers.items.length > 0) {
          razorpayCustomerId = customers.items[0].id;
        } else {
          const customer = await razorpay.customers.create({
            name: customerDetails.name,
            email: customerDetails.email,
            contact: customerDetails.contact,
            notes: {
              userId,
            },
          });
          razorpayCustomerId = customer.id;
        }
      } catch (error) {
        logger.error('❌ RazorpayService: Error creating/getting customer:', error);
        return { success: false, error: 'Failed to create customer' };
      }

      // Create subscription in Razorpay
      const subscriptionOptions = {
        plan_id: plan.razorpayPlanId,
        customer_notify: 1,
        total_count: plan.interval === 'year' ? 1 : 12, // For annual, 1 payment; for monthly, 12
        notes: {
          userId,
          planId,
        },
      };

      const razorpaySubscription = await razorpay.subscriptions.create(subscriptionOptions);

      logger.log('✅ RazorpayService: Subscription created:', razorpaySubscription.id);

      // Calculate period dates
      const now = new Date();
      const periodEnd = new Date(now);
      if (plan.interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Create subscription record in database
      const [subscription] = await db
        .insert(userSubscriptions)
        .values({
          userId,
          planId,
          status: razorpaySubscription.status === 'active' ? 'active' : 'active',
          razorpaySubscriptionId: razorpaySubscription.id,
          razorpayCustomerId,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        })
        .returning();

      // Create payment order record
      await db.insert(paymentOrders).values({
        userId,
        type: 'subscription',
        referenceId: planId,
        razorpaySubscriptionId: razorpaySubscription.id,
        amount: plan.price.toString(),
        currency: plan.currency,
        status: razorpaySubscription.status === 'active' ? 'completed' : 'pending',
        metadata: {
          planName: plan.name,
          creditsPerMonth: plan.creditsPerMonth,
        },
      });

      // Add initial credits if subscription is active
      if (razorpaySubscription.status === 'active') {
        await this.addSubscriptionCredits(userId, planId);
      }

      return {
        success: true,
        data: {
          subscriptionId: razorpaySubscription.id,
          status: razorpaySubscription.status,
          dbSubscriptionId: subscription.id,
        },
      };
    } catch (error) {
      logger.error('❌ RazorpayService: Error creating subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription',
      };
    }
  }

  /**
   * Add credits when subscription payment is successful
   */
  static async addSubscriptionCredits(userId: string, planId: string) {
    try {
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);

      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      // Get or create user credits record
      let [userCredit] = await db
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      if (!userCredit) {
        const [newCredit] = await db
          .insert(userCredits)
          .values({
            userId,
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
          })
          .returning();
        userCredit = newCredit;
      }

      // Update credits balance
      const newBalance = userCredit.balance + plan.creditsPerMonth;
      await db
        .update(userCredits)
        .set({
          balance: newBalance,
          totalEarned: userCredit.totalEarned + plan.creditsPerMonth,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));

      // Create transaction record
      await db.insert(creditTransactions).values({
        userId,
        amount: plan.creditsPerMonth,
        type: 'earned',
        description: `Monthly credits for ${plan.name} subscription`,
        referenceId: planId,
        referenceType: 'subscription',
      });

      return { success: true, newBalance };
    } catch (error) {
      logger.error('❌ RazorpayService: Error adding subscription credits:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add subscription credits',
      };
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    webhookBody: string,
    webhookSignature: string
  ): boolean {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(webhookBody)
        .digest('hex');

      return generatedSignature === webhookSignature;
    } catch (error) {
      logger.error('❌ RazorpayService: Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Handle Razorpay webhook events
   */
  static async handleWebhook(event: string, payload: any) {
    try {
      logger.log('📨 RazorpayService: Handling webhook event:', event);

      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(payload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(payload);
          break;
        case 'subscription.activated':
        case 'subscription.charged':
          await this.handleSubscriptionCharged(payload);
          break;
        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(payload);
          break;
        default:
          logger.log('⚠️ RazorpayService: Unhandled webhook event:', event);
      }

      return { success: true };
    } catch (error) {
      logger.error('❌ RazorpayService: Error handling webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook handling failed',
      };
    }
  }

  private static async handlePaymentCaptured(payload: any) {
    const paymentId = payload.payment?.entity?.id;
    const orderId = payload.payment?.entity?.order_id;

    if (!orderId || !paymentId) return;

    // Find payment order
    const [paymentOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.razorpayOrderId, orderId))
      .limit(1);

    if (!paymentOrder || paymentOrder.type !== 'credit_package') return;

    // Update payment order status
    await db
      .update(paymentOrders)
      .set({
        razorpayPaymentId: paymentId,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(paymentOrders.id, paymentOrder.id));

    // Add credits to user account
    if (paymentOrder.referenceId) {
      await this.addCreditsToAccount(paymentOrder.userId, paymentOrder.referenceId);
    }
  }

  private static async handlePaymentFailed(payload: any) {
    const orderId = payload.payment?.entity?.order_id;
    if (!orderId) return;

    await db
      .update(paymentOrders)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(paymentOrders.razorpayOrderId, orderId));
  }

  private static async handleSubscriptionCharged(payload: any) {
    const subscriptionId = payload.subscription?.entity?.id;
    if (!subscriptionId) return;

    // Find subscription
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId))
      .limit(1);

    if (!subscription) return;

    // Update subscription period
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db
      .update(userSubscriptions)
      .set({
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscription.id));

    // Add monthly credits
    await this.addSubscriptionCredits(subscription.userId, subscription.planId);
  }

  private static async handleSubscriptionCancelled(payload: any) {
    const subscriptionId = payload.subscription?.entity?.id;
    if (!subscriptionId) return;

    await db
      .update(userSubscriptions)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId));
  }
}

