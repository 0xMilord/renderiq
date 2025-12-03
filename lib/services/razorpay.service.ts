import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { paymentOrders, creditPackages, subscriptionPlans, userSubscriptions, userCredits, creditTransactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { InvoiceService } from './invoice.service';
import { ReceiptService } from './receipt.service';

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
      // Receipt must be max 40 characters (Razorpay requirement)
      // Format: pkg_<first8ofUUID>_<timestamp>
      const shortPackageId = creditPackageId.substring(0, 8);
      const shortTimestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
      const receipt = `pkg_${shortPackageId}_${shortTimestamp}`; // Max length: 3 + 1 + 8 + 1 + 8 = 21 chars
      
      // Razorpay minimum amounts (in base currency units)
      const minimumAmounts: Record<string, number> = {
        INR: 1.00,      // ₹1 minimum
        USD: 0.01,     // $0.01 minimum
        EUR: 0.01,     // €0.01 minimum
        GBP: 0.01,     // £0.01 minimum
        JPY: 1,        // ¥1 minimum
        AUD: 0.01,     // A$0.01 minimum
        CAD: 0.01,     // C$0.01 minimum
        SGD: 0.01,     // S$0.01 minimum
        AED: 0.01,     // د.إ0.01 minimum
        SAR: 0.01,     // ﷼0.01 minimum
      };

      const minimumAmount = minimumAmounts[currency] || 0.01;
      
      // Validate minimum amount
      if (amount < minimumAmount) {
        logger.error(`❌ RazorpayService: Amount ${amount} ${currency} is below minimum ${minimumAmount} ${currency}`);
        return { 
          success: false, 
          error: `Minimum order amount is ${minimumAmount} ${currency}. Please select a larger credit package.` 
        };
      }

      // Convert to smallest currency unit (paise for INR, cents for USD, etc.)
      // Most currencies use 100, but JPY uses 1
      const currencyMultiplier = currency === 'JPY' ? 1 : 100;
      const amountInSmallestUnit = Math.round(amount * currencyMultiplier);
      
      // Ensure minimum in smallest unit (e.g., 100 paise for INR, 1 cent for USD)
      const minimumInSmallestUnit = Math.ceil(minimumAmount * currencyMultiplier);
      if (amountInSmallestUnit < minimumInSmallestUnit) {
        logger.error(`❌ RazorpayService: Amount ${amountInSmallestUnit} is below minimum ${minimumInSmallestUnit} in smallest unit`);
        return { 
          success: false, 
          error: `Minimum order amount is ${minimumAmount} ${currency}. Please select a larger credit package.` 
        };
      }
      
      const orderOptions = {
        amount: amountInSmallestUnit,
        currency: currency,
        receipt: receipt, // Max 40 characters as per Razorpay API
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
      const isCompleted = payment.status === 'captured';
      await db
        .update(paymentOrders)
        .set({
          razorpayPaymentId: razorpayPaymentId,
          status: isCompleted ? 'completed' : 'processing',
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, paymentOrder.id));

      // Generate invoice and receipt for completed payments
      if (isCompleted) {
        try {
          // Create invoice
          await InvoiceService.createInvoice(paymentOrder.id);
          
          // Generate receipt PDF (async, don't block)
          ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
            logger.error('❌ RazorpayService: Error generating receipt:', error);
          });
        } catch (error) {
          logger.error('❌ RazorpayService: Error creating invoice/receipt:', error);
          // Don't fail the payment verification if invoice/receipt generation fails
        }
      }

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
    let plan: any = null;
    try {
      logger.log('💳 RazorpayService: Creating subscription:', { userId, planId });

      // Get subscription plan details
      const [planData] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);

      if (!planData) {
        return { success: false, error: 'Subscription plan not found' };
      }

      plan = planData;

      if (!plan.razorpayPlanId) {
        logger.error('❌ RazorpayService: Plan missing razorpayPlanId:', { 
          planId, 
          planName: plan.name, 
          planPrice: plan.price 
        });
        return { success: false, error: 'Razorpay plan ID not configured for this plan' };
      }

      // Validate Razorpay plan ID format (should start with 'plan_')
      if (!plan.razorpayPlanId.startsWith('plan_')) {
        logger.error('❌ RazorpayService: Invalid Razorpay plan ID format:', { 
          razorpayPlanId: plan.razorpayPlanId,
          planId,
          planName: plan.name 
        });
        return { 
          success: false, 
          error: `Invalid Razorpay plan ID format. Expected format: plan_xxxxx, got: ${plan.razorpayPlanId}` 
        };
      }

      logger.log('💳 RazorpayService: Plan details:', {
        planId,
        planName: plan.name,
        razorpayPlanId: plan.razorpayPlanId,
        price: plan.price,
        interval: plan.interval
      });

      // Create or get Razorpay customer
      const razorpay = getRazorpayInstance();
      let razorpayCustomerId: string;
      try {
        const customers = await razorpay.customers.all({ email: customerDetails.email, count: 1 });
        if (customers.items.length > 0) {
          razorpayCustomerId = customers.items[0].id;
          logger.log('💳 RazorpayService: Found existing customer:', razorpayCustomerId);
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
          logger.log('💳 RazorpayService: Created new customer:', razorpayCustomerId);
        }
      } catch (error: any) {
        logger.error('❌ RazorpayService: Error creating/getting customer:', {
          error: error.message,
          statusCode: error.statusCode,
          errorDescription: error.error?.description
        });
        return { 
          success: false, 
          error: `Failed to create customer: ${error.error?.description || error.message}` 
        };
      }

      // Try to verify plan exists first (this will help diagnose the issue)
      try {
        logger.log('💳 RazorpayService: Verifying plan exists:', plan.razorpayPlanId);
        // Note: Razorpay SDK doesn't have a direct plans.fetch method, so we'll try to create subscription
        // If subscriptions feature is not enabled, this will fail with "URL not found"
      } catch (verifyError: any) {
        logger.error('❌ RazorpayService: Plan verification failed:', verifyError);
        // Continue anyway - the create call will provide better error
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

      logger.log('💳 RazorpayService: Creating subscription with options:', subscriptionOptions);
      logger.log('💳 RazorpayService: Using Razorpay instance with key:', process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...');
      
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
    } catch (error: any) {
      const razorpayPlanId = plan?.razorpayPlanId || 'unknown';
      
      logger.error('❌ RazorpayService: Error creating subscription:', {
        error: error.message,
        statusCode: error.statusCode,
        errorCode: error.error?.code,
        errorDescription: error.error?.description,
        errorSource: error.error?.source,
        planId,
        razorpayPlanId,
        planName: plan?.name
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create subscription';
      
      if (error.statusCode === 400) {
        if (error.error?.description?.includes('not found') || error.error?.code === 'BAD_REQUEST_ERROR') {
          // This is almost certainly because subscriptions feature is not enabled
          errorMessage = `Subscriptions Feature Not Enabled

The Subscriptions feature is not enabled on your Razorpay account. Please contact Razorpay support to enable it.

Plan ID: ${razorpayPlanId}
Plan Name: ${plan?.name || 'Unknown'}
Account Mode: ${process.env.RAZORPAY_KEY_ID?.includes('rzp_test') ? 'TEST' : 'LIVE'}`;
        } else {
          errorMessage = error.error?.description || error.message || 'Invalid request to Razorpay';
        }
      } else if (error.statusCode === 401) {
        errorMessage = 'Razorpay authentication failed. Please check your API credentials.';
      } else if (error.statusCode === 404) {
        errorMessage = `Subscriptions Feature Not Enabled

The Subscriptions feature is not enabled on your Razorpay account. Please contact Razorpay support (support@razorpay.com) to enable it.`;
      } else {
        errorMessage = error.error?.description || error.message || 'Failed to create subscription';
      }
      
      return {
        success: false,
        error: errorMessage,
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

    // Generate invoice and receipt
    try {
      await InvoiceService.createInvoice(paymentOrder.id);
      ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
        logger.error('❌ RazorpayService: Error generating receipt in webhook:', error);
      });
    } catch (error) {
      logger.error('❌ RazorpayService: Error creating invoice/receipt in webhook:', error);
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

