/**
 * Paddle Payment Service
 * 
 * Handles all Paddle payment operations for international users
 * Implements PaymentProvider interface for unified payment handling
 */

import { Paddle } from '@paddle/paddle-node-sdk';
import { db } from '@/lib/db';
import { 
  paymentOrders, 
  creditPackages, 
  subscriptionPlans, 
  userSubscriptions, 
  userCredits, 
  creditTransactions,
  invoices,
  users
} from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { InvoiceService } from './invoice.service';
import { ReceiptService } from './receipt.service';
import { BillingService } from './billing';
import type {
  PaymentProvider,
  PaymentProviderType,
  OrderResult,
  PaymentVerificationData,
  VerificationResult,
  SubscriptionResult,
  CancelResult,
} from './payment-provider.interface';

// Lazy initialization of Paddle instance
let paddleInstance: Paddle | null = null;

function getPaddleInstance(): Paddle {
  if (!paddleInstance) {
    const apiKey = process.env.PADDLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('Paddle API key is not configured. Please set PADDLE_API_KEY environment variable.');
    }
    
    // Initialize Paddle SDK
    // Paddle uses environment-based initialization (sandbox vs production)
    paddleInstance = new Paddle(apiKey, {
      environment: process.env.PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
    });
  }
  
  return paddleInstance;
}

export class PaddleService implements PaymentProvider {
  getProviderType(): PaymentProviderType {
    return 'paddle';
  }

  /**
   * Create a Paddle transaction for one-time payment (credit package)
   */
  async createOrder(
    userId: string,
    creditPackageId: string,
    amount: number,
    currency: string
  ): Promise<OrderResult> {
    try {
      logger.log('💳 PaddleService: Creating transaction for credit package:', { userId, creditPackageId, amount, currency });

      // Get credit package details
      const [packageData] = await db
        .select()
        .from(creditPackages)
        .where(eq(creditPackages.id, creditPackageId))
        .limit(1);

      if (!packageData) {
        return { success: false, error: 'Credit package not found' };
      }

      if (!packageData.isActive) {
        return { success: false, error: 'Credit package is not available' };
      }

      // Get user details
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userData || !userData.email) {
        return { success: false, error: 'User not found or email missing' };
      }

      const paddle = getPaddleInstance();

      // Create a transaction in Paddle
      // Paddle uses transactions for one-time payments
      const transaction = await paddle.transactions.create({
        items: [
          {
            priceId: this.getPriceIdForPackage(creditPackageId, amount, currency),
            quantity: 1,
          },
        ],
        customerId: await this.getOrCreateCustomer(userId, userData.email, userData.name || ''),
        currencyCode: currency,
        customData: {
          userId,
          creditPackageId,
          credits: packageData.credits,
          bonusCredits: packageData.bonusCredits,
        },
      });

      logger.log('✅ PaddleService: Transaction created:', transaction.id);

      // Return checkout URL for hosted checkout
      return {
        success: true,
        data: {
          orderId: transaction.id,
          amount,
          currency,
          creditPackageId,
          credits: packageData.credits,
          bonusCredits: packageData.bonusCredits,
          packageName: packageData.name,
          checkoutUrl: transaction.checkout?.url || undefined,
        },
      };
    } catch (error) {
      logger.error('❌ PaddleService: Error creating transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transaction',
      };
    }
  }

  /**
   * Verify a Paddle payment after completion
   */
  async verifyPayment(paymentData: PaymentVerificationData): Promise<VerificationResult> {
    try {
      logger.log('🔐 PaddleService: Verifying payment:', paymentData);

      const { transactionId } = paymentData;
      if (!transactionId) {
        return { success: false, error: 'Transaction ID is required' };
      }

      const paddle = getPaddleInstance();

      // Fetch transaction from Paddle
      const transaction = await paddle.transactions.get(transactionId);

      // Check if transaction is completed
      if (transaction.status !== 'completed') {
        logger.warn('⚠️ PaddleService: Transaction not completed, status:', transaction.status);
        return {
          success: false,
          error: `Transaction not completed. Status: ${transaction.status}`,
        };
      }

      // Check for existing payment order
      const [existingOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.paddleTransactionId, transactionId))
        .limit(1);

      if (existingOrder) {
        logger.log('✅ PaddleService: Payment order already exists:', existingOrder.id);
        return {
          success: true,
          data: {
            paymentOrderId: existingOrder.id,
            amount: parseFloat(existingOrder.amount),
            currency: existingOrder.currency,
            status: existingOrder.status as any,
            transactionId,
          },
        };
      }

      // Extract metadata from transaction
      const customData = transaction.customData as any;
      const userId = customData?.userId;
      const creditPackageId = customData?.creditPackageId;

      if (!userId || !creditPackageId) {
        return { success: false, error: 'Missing transaction metadata' };
      }

      // Get package details
      const [packageData] = await db
        .select()
        .from(creditPackages)
        .where(eq(creditPackages.id, creditPackageId))
        .limit(1);

      if (!packageData) {
        return { success: false, error: 'Credit package not found' };
      }

      // Calculate amounts
      const totalAmount = parseFloat(transaction.totals?.total || '0');
      const taxAmount = parseFloat(transaction.totals?.tax || '0');
      const currency = transaction.currencyCode || 'USD';

      // Create payment order
      const [paymentOrder] = await db
        .insert(paymentOrders)
        .values({
          userId,
          type: 'credit_package',
          referenceId: creditPackageId,
          paddleTransactionId: transactionId,
          amount: totalAmount.toString(),
          currency,
          status: 'completed',
          paymentProvider: 'paddle',
          taxAmount: taxAmount.toString(),
          metadata: {
            paddleTransactionId: transactionId,
            paddleCustomerId: transaction.customerId,
            items: transaction.items,
          },
        })
        .returning();

      logger.log('✅ PaddleService: Payment order created:', paymentOrder.id);

      // Add credits to user account
      await this.addCreditsToAccount(userId, creditPackageId, paymentOrder.id);

      // Generate invoice
      await InvoiceService.createInvoice(paymentOrder.id);

      // Generate receipt PDF and send email (in parallel, non-blocking)
      Promise.all([
        ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
          logger.error('❌ PaddleService: Failed to generate receipt PDF:', error);
        }),
        ReceiptService.sendReceiptEmail(paymentOrder.id).catch((error) => {
          logger.error('❌ PaddleService: Failed to send receipt email:', error);
        }),
      ]);

      return {
        success: true,
        data: {
          paymentOrderId: paymentOrder.id,
          amount: totalAmount,
          currency,
          status: 'completed',
          transactionId,
        },
      };
    } catch (error) {
      logger.error('❌ PaddleService: Error verifying payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify payment',
      };
    }
  }

  /**
   * Create a Paddle subscription
   */
  async createSubscription(
    userId: string,
    planId: string,
    currency: string
  ): Promise<SubscriptionResult> {
    try {
      logger.log('💳 PaddleService: Creating subscription:', { userId, planId, currency });

      // Get subscription plan details
      const [planData] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);

      if (!planData) {
        return { success: false, error: 'Subscription plan not found' };
      }

      // Get user details
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userData || !userData.email) {
        return { success: false, error: 'User not found or email missing' };
      }

      const paddle = getPaddleInstance();

      // Get or create customer
      const customerId = await this.getOrCreateCustomer(userId, userData.email, userData.name || '');

      // Get price ID for the plan
      const priceId = this.getPriceIdForPlan(planId, currency);
      if (!priceId) {
        return { success: false, error: 'Price ID not configured for this plan' };
      }

      // Create subscription in Paddle
      const subscription = await paddle.subscriptions.create({
        customerId,
        items: [
          {
            priceId,
            quantity: 1,
          },
        ],
        customData: {
          userId,
          planId,
        },
      });

      logger.log('✅ PaddleService: Subscription created:', subscription.id);

      // Return subscription details
      return {
        success: true,
        data: {
          subscriptionId: subscription.id,
          customerId: customerId,
          checkoutUrl: subscription.currentBillingPeriod ? undefined : subscription.checkout?.url,
        },
      };
    } catch (error) {
      logger.error('❌ PaddleService: Error creating subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription',
      };
    }
  }

  /**
   * Cancel a Paddle subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<CancelResult> {
    try {
      logger.log('💳 PaddleService: Cancelling subscription:', subscriptionId);

      const paddle = getPaddleInstance();

      // Cancel subscription in Paddle
      await paddle.subscriptions.cancel(subscriptionId, {
        effectiveFrom: 'next_billing_period', // Cancel at end of billing period
      });

      logger.log('✅ PaddleService: Subscription cancelled:', subscriptionId);

      return { success: true };
    } catch (error) {
      logger.error('❌ PaddleService: Error cancelling subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  }

  /**
   * Verify Paddle webhook signature
   */
  verifyWebhook(body: string, signature: string): boolean {
    try {
      const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        logger.error('❌ PaddleService: Webhook secret not configured');
        return false;
      }

      // Paddle uses HMAC SHA256 for webhook verification
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      // Paddle sends signature in format: ts=timestamp,v1=signature
      // Extract the v1 signature
      const signatureParts = signature.split(',');
      const v1Part = signatureParts.find((part: string) => part.startsWith('v1='));
      const receivedSignature = v1Part ? v1Part.split('=')[1] : signature;

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(receivedSignature)
      );
    } catch (error) {
      logger.error('❌ PaddleService: Error verifying webhook:', error);
      return false;
    }
  }

  /**
   * Handle Paddle webhook events
   */
  async handleWebhook(event: string, payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      logger.log('📨 PaddleService: Handling webhook event:', event);

      switch (event) {
        case 'transaction.completed':
          await this.handleTransactionCompleted(payload);
          break;
        case 'transaction.payment_failed':
          await this.handleTransactionFailed(payload);
          break;
        case 'subscription.created':
          await this.handleSubscriptionCreated(payload);
          break;
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(payload);
          break;
        case 'subscription.canceled':
          await this.handleSubscriptionCanceled(payload);
          break;
        case 'subscription.payment_succeeded':
        case 'subscription.payment_completed':
          // Handle recurring subscription payment
          await this.handleSubscriptionPaymentCompleted(payload);
          break;
        default:
          logger.log('⚠️ PaddleService: Unhandled webhook event:', event);
      }

      return { success: true };
    } catch (error) {
      logger.error('❌ PaddleService: Error handling webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook handling failed',
      };
    }
  }

  // Private helper methods

  private async getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
    const paddle = getPaddleInstance();

    // Check if customer already exists in Paddle
    // In production, you might want to store Paddle customer IDs in your database
    try {
      // Try to find existing customer by email
      const customers = await paddle.customers.list({ email });
      if (customers.data && customers.data.length > 0) {
        return customers.data[0].id;
      }
    } catch (error) {
      // Customer doesn't exist, create new one
    }

    // Create new customer
    const customer = await paddle.customers.create({
      email,
      name: name || email,
      customData: {
        userId,
      },
    });

    return customer.id;
  }

  private getPriceIdForPackage(packageId: string, amount: number, currency: string): string {
    // In production, you should create prices in Paddle dashboard and store the IDs
    // For now, we'll use a mapping or create prices on-the-fly
    // This is a placeholder - you need to configure actual price IDs in Paddle
    
    // Check environment variable for price ID mapping
    const priceIdMap = process.env.PADDLE_PRICE_IDS;
    if (priceIdMap) {
      try {
        const prices = JSON.parse(priceIdMap);
        const key = `${packageId}_${currency}`;
        if (prices[key]) {
          return prices[key];
        }
      } catch (error) {
        logger.error('❌ PaddleService: Error parsing price ID map:', error);
      }
    }

    // Fallback: You need to create prices in Paddle dashboard
    // For MVP, we'll throw an error to ensure proper configuration
    throw new Error(
      `Price ID not configured for package ${packageId} in currency ${currency}. ` +
      `Please create a price in Paddle dashboard and set PADDLE_PRICE_IDS environment variable.`
    );
  }

  private getPriceIdForPlan(planId: string, currency: string): string | null {
    // Similar to getPriceIdForPackage, but for subscription plans
    const priceIdMap = process.env.PADDLE_PRICE_IDS;
    if (priceIdMap) {
      try {
        const prices = JSON.parse(priceIdMap);
        const key = `${planId}_${currency}`;
        if (prices[key]) {
          return prices[key];
        }
      } catch (error) {
        logger.error('❌ PaddleService: Error parsing price ID map:', error);
      }
    }

    return null;
  }

  private async addCreditsToAccount(
    userId: string,
    creditPackageId: string,
    paymentOrderId: string
  ): Promise<void> {
    const [packageData] = await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.id, creditPackageId))
      .limit(1);

    if (!packageData) {
      throw new Error('Credit package not found');
    }

    const totalCredits = packageData.credits + packageData.bonusCredits;

    const result = await BillingService.addCredits(
      userId,
      totalCredits,
      'earned',
      `Purchased ${packageData.name} via Paddle`,
      paymentOrderId,
      'credit_package' // Fixed: should be 'credit_package' not 'subscription'
    );

    // Send credits added email notification
    if (result.success && result.newBalance !== undefined) {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user?.email) {
          const { sendCreditsAddedEmail } = await import('@/lib/services/email.service');
          await sendCreditsAddedEmail({
            name: user.name || 'User',
            email: user.email,
            credits: totalCredits,
            balance: result.newBalance,
            reason: `Purchased ${packageData.name} via Paddle`,
            transactionId: paymentOrderId,
          });
        }
      } catch (error) {
        logger.error('❌ PaddleService: Failed to send credits added email:', error);
        // Don't fail credit addition if email fails
      }
    }
  }

  private async handleTransactionCompleted(payload: any): Promise<void> {
    const transactionId = payload.data?.id;
    if (!transactionId) return;

    // Verify payment if not already verified
    await this.verifyPayment({ transactionId });
  }

  private async handleTransactionFailed(payload: any): Promise<void> {
    const transactionId = payload.data?.id;
    if (!transactionId) return;

    // Update payment order status to failed
    await db
      .update(paymentOrders)
      .set({ status: 'failed' })
      .where(eq(paymentOrders.paddleTransactionId, transactionId));
  }

  private async handleSubscriptionCreated(payload: any): Promise<void> {
    const subscription = payload.data;
    const customData = subscription.customData as any;
    const userId = customData?.userId;
    const planId = customData?.planId;

    if (!userId || !planId) {
      logger.error('❌ PaddleService: Missing subscription metadata');
      return;
    }

    // Create subscription record in database
    const [planData] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!planData) {
      logger.error('❌ PaddleService: Plan not found:', planId);
      return;
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (planData.interval === 'year' ? 12 : 1));

    await db.insert(userSubscriptions).values({
      userId,
      planId,
      status: 'active',
      paddleSubscriptionId: subscription.id,
      paddleCustomerId: subscription.customerId,
      paymentProvider: 'paddle',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    // Add initial credits
    const creditsResult = await BillingService.addCredits(
      userId,
      planData.creditsPerMonth,
      'earned',
      `Subscription activated: ${planData.name}`,
      subscription.id,
      'subscription'
    );

    // Send subscription activated email and credits added email
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user?.email) {
        const { sendSubscriptionActivatedEmail, sendCreditsAddedEmail } = await import('@/lib/services/email.service');
        
        // Send subscription activated email
        await sendSubscriptionActivatedEmail({
          name: user.name || 'User',
          email: user.email,
          planName: planData.name,
          amount: parseFloat(planData.price),
          currency: planData.currency || 'USD',
          interval: planData.interval,
          creditsPerMonth: planData.creditsPerMonth,
        });

        // Send credits added email
        if (creditsResult.success && creditsResult.newBalance !== undefined) {
          await sendCreditsAddedEmail({
            name: user.name || 'User',
            email: user.email,
            credits: planData.creditsPerMonth,
            balance: creditsResult.newBalance,
            reason: `Subscription activated: ${planData.name}`,
            transactionId: subscription.id,
          });
        }
      }
    } catch (error) {
      logger.error('❌ PaddleService: Failed to send subscription emails:', error);
      // Don't fail subscription activation if email fails
    }
  }

  private async handleSubscriptionUpdated(payload: any): Promise<void> {
    const subscription = payload.data;
    const subscriptionId = subscription.id;

    // Update subscription in database
    await db
      .update(userSubscriptions)
      .set({
        status: subscription.status === 'active' ? 'active' : 'canceled',
        currentPeriodStart: subscription.currentBillingPeriod?.startsAt
          ? new Date(subscription.currentBillingPeriod.startsAt)
          : undefined,
        currentPeriodEnd: subscription.currentBillingPeriod?.endsAt
          ? new Date(subscription.currentBillingPeriod.endsAt)
          : undefined,
      })
      .where(eq(userSubscriptions.paddleSubscriptionId, subscriptionId));
  }

  private async handleSubscriptionCanceled(payload: any): Promise<void> {
    const subscription = payload.data;
    const subscriptionId = subscription.id;

    // Update subscription status
    await db
      .update(userSubscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
      })
      .where(eq(userSubscriptions.paddleSubscriptionId, subscriptionId));
  }

  /**
   * Handle recurring subscription payment (monthly/yearly renewal)
   */
  private async handleSubscriptionPaymentCompleted(payload: any): Promise<void> {
    const subscription = payload.data;
    const subscriptionId = subscription.id;

    logger.log('💳 PaddleService: Handling subscription payment completed:', subscriptionId);

    // Find subscription in database
    const [subscriptionRecord] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.paddleSubscriptionId, subscriptionId))
      .limit(1);

    if (!subscriptionRecord) {
      logger.warn('⚠️ PaddleService: Subscription not found in database:', subscriptionId);
      return;
    }

    // Get plan details
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscriptionRecord.planId))
      .limit(1);

    if (!plan) {
      logger.error('❌ PaddleService: Plan not found:', subscriptionRecord.planId);
      return;
    }

    // Update subscription period
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.interval === 'year') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await db
      .update(userSubscriptions)
      .set({
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscriptionRecord.id));

    // Add monthly credits
    const creditsResult = await BillingService.addCredits(
      subscriptionRecord.userId,
      plan.creditsPerMonth,
      'earned',
      `Monthly credits for ${plan.name} subscription`,
      subscriptionId,
      'subscription'
    );

    // Create payment order for recurring payment
    try {
      const transactionId = subscription.latestTransaction?.id || subscriptionId;
      const amount = parseFloat(subscription.items?.[0]?.price?.unitAmount || plan.price);
      const currency = subscription.currencyCode || plan.currency || 'USD';

      const [paymentOrder] = await db
        .insert(paymentOrders)
        .values({
          userId: subscriptionRecord.userId,
          type: 'subscription',
          referenceId: subscriptionRecord.planId,
          paddleSubscriptionId: subscriptionId,
          paddleTransactionId: transactionId,
          amount: amount.toString(),
          currency,
          status: 'completed',
          paymentProvider: 'paddle',
          metadata: {
            paddleSubscriptionId: subscriptionId,
            paddleTransactionId: transactionId,
            isRecurring: true,
          },
        })
        .returning();

      // Generate invoice and receipt (non-blocking)
      Promise.all([
        InvoiceService.createInvoice(paymentOrder.id).catch((error) => {
          logger.error('❌ PaddleService: Failed to create invoice:', error);
        }),
        ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
          logger.error('❌ PaddleService: Failed to generate receipt PDF:', error);
        }),
        ReceiptService.sendReceiptEmail(paymentOrder.id).catch((error) => {
          logger.error('❌ PaddleService: Failed to send receipt email:', error);
        }),
      ]);

      // Send emails
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, subscriptionRecord.userId))
          .limit(1);

        if (user?.email) {
          const { sendSubscriptionRenewedEmail, sendCreditsAddedEmail } = await import('@/lib/services/email.service');
          
          // Send subscription renewed email
          await sendSubscriptionRenewedEmail({
            name: user.name || 'User',
            email: user.email,
            planName: plan.name,
            amount: amount,
            currency: currency,
            interval: plan.interval,
            creditsPerMonth: plan.creditsPerMonth,
          });

          // Send credits added email
          if (creditsResult.success && creditsResult.newBalance !== undefined) {
            await sendCreditsAddedEmail({
              name: user.name || 'User',
              email: user.email,
              credits: plan.creditsPerMonth,
              balance: creditsResult.newBalance,
              reason: `Monthly credits for ${plan.name} subscription`,
              transactionId: subscriptionId,
            });
          }
        }
      } catch (error) {
        logger.error('❌ PaddleService: Failed to send subscription renewal emails:', error);
      }
    } catch (error) {
      logger.error('❌ PaddleService: Error creating recurring payment order:', error);
    }
  }
}

