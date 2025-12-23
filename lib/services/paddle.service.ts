/**
 * Paddle Payment Service
 * 
 * Handles all Paddle payment operations for international users
 * Implements PaymentProvider interface for unified payment handling
 * 
 * REQUIRED API KEY PERMISSIONS:
 * - customers:read - To list and find existing customers
 * - customers:write - To create new customers
 * - transactions:write - To create transactions for payments
 * - subscriptions:read - To read subscription details (for subscriptions)
 * - subscriptions:write - To create and manage subscriptions (for subscriptions)
 * 
 * To configure API key permissions:
 * 1. Go to Paddle Dashboard > Developer Tools > Authentication
 * 2. Select your API key
 * 3. Ensure all required permissions are enabled
 * 4. Verify the API key environment matches PADDLE_ENVIRONMENT (sandbox/production)
 * 
 * For more information: https://developer.paddle.com/api-reference/about/authentication
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
      const error = new Error('Paddle API key is not configured. Please set PADDLE_API_KEY environment variable.');
      logger.error('❌ PaddleService: PADDLE_API_KEY is not set', error);
      throw error;
    }
    
    // Validate API key format and auto-detect environment
    const isSandboxKey = apiKey.startsWith('pdl_sdbx_');
    const isLiveKey = apiKey.startsWith('pdl_live_');
    
    if (!isSandboxKey && !isLiveKey) {
      logger.warn('⚠️ PaddleService: API key format unexpected. Expected pdl_sdbx_* or pdl_live_* prefix');
    }
    
    // Auto-detect environment from API key format (override manual setting if mismatch)
    let detectedEnvironment: 'sandbox' | 'production';
    if (isSandboxKey) {
      detectedEnvironment = 'sandbox';
    } else if (isLiveKey) {
      detectedEnvironment = 'production';
    } else {
      // Fallback to manual setting if key format is unknown
      detectedEnvironment = process.env.PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
    }
    
    // Check for environment mismatch and warn/auto-correct
    const manualEnvironment = process.env.PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
    if (isSandboxKey && manualEnvironment === 'production') {
      logger.warn('⚠️ PaddleService: Sandbox API key detected but PADDLE_ENVIRONMENT is set to production. Using sandbox environment.');
    }
    if (isLiveKey && manualEnvironment === 'sandbox') {
      logger.warn('⚠️ PaddleService: Live API key detected but PADDLE_ENVIRONMENT is set to sandbox. Using production environment.');
      logger.error('❌ PaddleService: CRITICAL - Live API key being used with sandbox environment will cause forbidden errors!');
      logger.error('❌ PaddleService: Please set PADDLE_ENVIRONMENT=production to match your live API key.');
    }
    
    // Initialize Paddle SDK with auto-detected environment
    // Paddle uses environment-based initialization (sandbox vs production)
    try {
      paddleInstance = new Paddle(apiKey, {
        environment: detectedEnvironment,
      } as any); // Type assertion for SDK compatibility
      logger.log('✅ PaddleService: Paddle SDK initialized successfully', {
        environment: detectedEnvironment,
        apiKeyPrefix: apiKey.substring(0, 12) + '...',
        keyType: isSandboxKey ? 'sandbox' : isLiveKey ? 'live' : 'unknown',
        autoDetected: detectedEnvironment !== manualEnvironment,
      });
    } catch (error) {
      logger.error('❌ PaddleService: Failed to initialize Paddle SDK', error);
      throw error;
    }
  }
  
  return paddleInstance;
}

export class PaddleService implements PaymentProvider {
  getProviderType(): PaymentProviderType {
    return 'paddle';
  }

  /**
   * Fetch price details from Paddle API by Price ID
   * Returns the actual USD price stored in Paddle
   */
  async getPriceById(priceId: string): Promise<{ amount: number; currency: string } | null> {
    try {
      const paddle = getPaddleInstance();
      
      // Fetch price from Paddle API
      // Note: Paddle SDK structure may vary, handle different possible structures
      let price: any;
      try {
        // Try different possible SDK methods
        if (typeof paddle.prices?.get === 'function') {
          price = await paddle.prices.get(priceId);
        } else if (typeof (paddle as any).prices?.retrieve === 'function') {
          price = await (paddle as any).prices.retrieve(priceId);
        } else {
          logger.warn('⚠️ PaddleService: Price API method not found in SDK');
          return null;
        }
      } catch (apiError: any) {
        // If price not found or API error, return null
        if (apiError?.code === 'not_found' || apiError?.statusCode === 404) {
          logger.warn('⚠️ PaddleService: Price not found in Paddle:', priceId);
          return null;
        }
        throw apiError; // Re-throw other errors
      }
      
      if (!price) {
        logger.warn('⚠️ PaddleService: Price not found:', priceId);
        return null;
      }

      // Extract amount and currency from price
      // Paddle price object structure may vary:
      // Option 1: { unitPrice: { amount: string, currencyCode: string } }
      // Option 2: { amount: string, currency: string }
      // Option 3: { unitPrice: { amount: { amount: string, currencyCode: string } } }
      let amount: number | null = null;
      let currencyCode = 'USD';

      if (price.unitPrice?.amount) {
        // Structure: { unitPrice: { amount: string, currencyCode: string } }
        amount = typeof price.unitPrice.amount === 'string' 
          ? parseFloat(price.unitPrice.amount) 
          : price.unitPrice.amount;
        currencyCode = price.unitPrice.currencyCode || 'USD';
      } else if (price.amount) {
        // Structure: { amount: string, currency: string }
        amount = typeof price.amount === 'string' ? parseFloat(price.amount) : price.amount;
        currencyCode = price.currency || price.currencyCode || 'USD';
      } else if (price.unitPrice?.amount?.amount) {
        // Nested structure
        amount = typeof price.unitPrice.amount.amount === 'string'
          ? parseFloat(price.unitPrice.amount.amount)
          : price.unitPrice.amount.amount;
        currencyCode = price.unitPrice.amount.currencyCode || 'USD';
      }

      if (amount === null || isNaN(amount)) {
        logger.warn('⚠️ PaddleService: Could not extract price amount from Paddle response:', {
          priceId,
          priceStructure: Object.keys(price),
        });
        return null;
      }

      logger.log('✅ PaddleService: Fetched price from Paddle:', { priceId, amount, currency: currencyCode });
      return { amount, currency: currencyCode };
    } catch (error: any) {
      logger.error('❌ PaddleService: Error fetching price from Paddle:', {
        priceId,
        error: error?.message || error,
        code: error?.code,
      });
      return null;
    }
  }

  /**
   * Get Paddle price for a package/plan by looking up the Price ID
   * Returns the actual USD price from Paddle, not a converted amount
   */
  async getPriceForPackage(packageId: string, currency: string = 'USD'): Promise<number | null> {
    try {
      const priceId = this.getPriceIdForPackage(packageId, 0, currency); // amount doesn't matter for lookup
      if (!priceId) {
        return null;
      }
      
      const priceData = await this.getPriceById(priceId);
      return priceData?.amount || null;
    } catch (error) {
      logger.error('❌ PaddleService: Error getting price for package:', error);
      return null;
    }
  }

  /**
   * Get Paddle price for a subscription plan by looking up the Price ID
   */
  async getPriceForPlan(planId: string, currency: string = 'USD'): Promise<number | null> {
    try {
      const priceId = this.getPriceIdForPlan(planId, currency);
      if (!priceId) {
        return null;
      }
      
      const priceData = await this.getPriceById(priceId);
      return priceData?.amount || null;
    } catch (error) {
      logger.error('❌ PaddleService: Error getting price for plan:', error);
      return null;
    }
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

      // Get Paddle Price ID (Paddle uses fixed prices from Price IDs)
      const priceId = this.getPriceIdForPackage(creditPackageId, 0, currency); // amount doesn't matter, Paddle uses Price ID price
      
      // ⚠️ IMPORTANT: When using priceId, Paddle IGNORES the amount parameter
      // The actual charge will be the fixed price stored in the Price ID in Paddle dashboard
      // We still pass 'amount' for logging/record keeping, but Paddle won't use it
      logger.log('💳 PaddleService: Creating transaction with Price ID (Paddle will use Price ID price, not amount parameter):', {
        priceId,
        amountPassed: amount,
        currency,
        note: 'Paddle will charge the fixed price from Price ID, not the converted amount'
      });

      // Create a transaction in Paddle
      // Paddle uses transactions for one-time payments
      const transaction = await paddle.transactions.create({
        items: [
          {
            priceId: priceId,
            quantity: 1,
          },
        ],
        customerId: await this.getOrCreateCustomer(userId, userData.email, userData.name || ''),
        currencyCode: currency as any, // Paddle SDK type expects specific CurrencyCode type
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
    } catch (error: any) {
      // Log full error details for debugging
      logger.error('❌ PaddleService: Error creating transaction:', {
        code: error?.code,
        type: error?.type,
        detail: error?.detail,
        message: error?.message,
        statusCode: error?.statusCode,
        errors: error?.errors,
        fullError: JSON.stringify(error, null, 2),
      });
      
      // Check if it's a permission error
      if (error?.code === 'forbidden' || error?.type === 'request_error') {
        const errorMessage = error?.detail || error?.message || 'Forbidden';
        return {
          success: false,
          error: `Paddle API key does not have the required permissions. ` +
                 `Please check your API key permissions in Paddle Dashboard > Developer Tools > Authentication. ` +
                 `Required permissions: customers:read, customers:write, transactions:write. ` +
                 `Also verify: (1) API key is active, (2) No IP whitelisting restrictions, (3) Account verification is complete. ` +
                 `Original error: ${errorMessage}. ` +
                 `For more help, visit: https://developer.paddle.com/api-reference/about/authentication`
        };
      }
      
      // Return generic error for other cases
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
      // Paddle transaction structure may vary - handle different possible structures
      const totals = (transaction as any).totals || (transaction as any).details?.totals;
      const totalAmount = totals?.total ? parseFloat(totals.total.toString()) : 
                         (transaction as any).total ? parseFloat((transaction as any).total.toString()) :
                         parseFloat((transaction as any).amount?.toString() || '0');
      const taxAmount = totals?.tax ? parseFloat(totals.tax.toString()) : 0;
      const currency = transaction.currencyCode || (transaction as any).currency || 'USD';

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
      // Note: Using any type for SDK compatibility as method signatures may vary
      const subscription = await (paddle.subscriptions as any).create({
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
      // Paddle SDK expects email as array or uses different structure
      const customers = await paddle.customers.list({ email: [email] } as any);
      // Access customers using proper method (data might be private)
      const customerList = (customers as any).data || (customers as any).items || [];
      if (customerList.length > 0) {
        logger.log('✅ PaddleService: Found existing customer:', customerList[0].id);
        return customerList[0].id;
      }
    } catch (error: any) {
      // Log full error details for debugging
      logger.error('❌ PaddleService: Error listing customers:', {
        code: error?.code,
        type: error?.type,
        detail: error?.detail,
        message: error?.message,
        statusCode: error?.statusCode,
        errors: error?.errors,
        fullError: JSON.stringify(error, null, 2),
      });
      
      // Check if it's a permission error
      if (error?.code === 'forbidden' || error?.type === 'request_error') {
        const errorDetail = error?.detail || error?.message || 'Forbidden';
        logger.error('❌ PaddleService: API key lacks permission to list customers. Full error:', error);
        throw new Error(
          'Paddle API key does not have permission to access customers. ' +
          'Please check your API key permissions in Paddle Dashboard > Developer Tools > Authentication. ' +
          'The API key needs "customers:read" and "customers:write" permissions. ' +
          'Also verify: (1) API key is active, (2) No IP whitelisting restrictions, (3) Account verification is complete. ' +
          `Original error: ${errorDetail}`
        );
      }
      // For other errors, log but continue to try creating
      logger.warn('⚠️ PaddleService: Error listing customers, will try to create new one:', error?.message || error);
    }

    // Create new customer
    try {
    const customer = await paddle.customers.create({
      email,
      name: name || email,
      customData: {
        userId,
      },
    });

      logger.log('✅ PaddleService: Created new customer:', customer.id);
    return customer.id;
    } catch (error: any) {
      // Log full error details for debugging
      logger.error('❌ PaddleService: Error creating customer:', {
        code: error?.code,
        type: error?.type,
        detail: error?.detail,
        message: error?.message,
        statusCode: error?.statusCode,
        errors: error?.errors,
        fullError: JSON.stringify(error, null, 2),
      });
      
      // Handle customer already exists error - extract customer ID from error message
      if (error?.code === 'customer_already_exists') {
        const errorDetail = error?.detail || error?.message || '';
        // Extract customer ID from error message: "customer email conflicts with customer of id ctm_01kd4e20zthbzmmkzp113g972f"
        const customerIdMatch = errorDetail.match(/customer of id\s+(\w+)/i) || errorDetail.match(/id\s+(\w+)/i);
        if (customerIdMatch && customerIdMatch[1]) {
          const customerId = customerIdMatch[1];
          logger.log('✅ PaddleService: Customer already exists, using existing customer ID:', customerId);
          return customerId;
        }
        // If we can't extract the ID, try to get it from the error object
        if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
          const firstError = error.errors[0];
          if (firstError?.detail) {
            const idMatch = firstError.detail.match(/customer of id\s+(\w+)/i) || firstError.detail.match(/id\s+(\w+)/i);
            if (idMatch && idMatch[1]) {
              logger.log('✅ PaddleService: Customer already exists, using existing customer ID from error:', idMatch[1]);
              return idMatch[1];
            }
          }
        }
        // Last resort: try to fetch customer by email again
        logger.warn('⚠️ PaddleService: Could not extract customer ID from error, attempting to fetch by email');
        try {
          const customers = await paddle.customers.list({ email: [email] } as any);
          const customerList = (customers as any).data || (customers as any).items || [];
          if (customerList.length > 0) {
            logger.log('✅ PaddleService: Found existing customer after retry:', customerList[0].id);
            return customerList[0].id;
          }
        } catch (retryError) {
          logger.error('❌ PaddleService: Failed to fetch customer by email after already_exists error:', retryError);
        }
        // If all else fails, throw a helpful error
        throw new Error(
          `Customer already exists but could not retrieve customer ID. ` +
          `Error detail: ${errorDetail}. ` +
          `Please check Paddle dashboard for customer with email: ${email}`
        );
      }
      
      // Check if it's a permission error
      if (error?.code === 'forbidden' || (error?.type === 'request_error' && error?.code === 'forbidden')) {
        const errorDetail = error?.detail || error?.message || 'Forbidden';
        logger.error('❌ PaddleService: API key lacks permission to create customers. Full error:', error);
        throw new Error(
          'Paddle API key does not have permission to create customers. ' +
          'Please check your API key permissions in Paddle Dashboard > Developer Tools > Authentication. ' +
          'The API key needs "customers:write" permission. ' +
          'Also verify: (1) API key is active, (2) No IP whitelisting restrictions, (3) Account verification is complete. ' +
          `Original error: ${errorDetail}`
        );
      }
      // Re-throw other errors
      logger.error('❌ PaddleService: Error creating customer:', error);
      throw error;
    }
  }

  getPriceIdForPackage(packageId: string, amount: number, currency: string): string {
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

  getPriceIdForPlan(planId: string, currency: string): string | null {
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
      'render' as any // Use 'render' type as workaround for type system
    );

    // Send credits added email notification
    if (result.success && 'newBalance' in result && result.newBalance !== undefined) {
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
            balance: 'newBalance' in result ? result.newBalance : 0,
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
    // PaymentVerificationData requires orderId and paymentId, but for Paddle we use transactionId
    await this.verifyPayment({ 
      orderId: transactionId, // Use transactionId as orderId for Paddle
      paymentId: transactionId, // Use transactionId as paymentId for Paddle
      transactionId 
    } as any);
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
          billingCycle: planData.interval === 'year' ? 'yearly' : 'monthly',
          nextBillingDate: periodEnd,
          subscriptionId: subscription.id,
        });

        // Send credits added email
        if (creditsResult.success && 'newBalance' in creditsResult && creditsResult.newBalance !== undefined) {
          await sendCreditsAddedEmail({
            name: user.name || 'User',
            email: user.email,
            credits: planData.creditsPerMonth,
            balance: 'newBalance' in creditsResult ? creditsResult.newBalance : 0,
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
            billingCycle: plan.interval === 'year' ? 'yearly' : 'monthly',
            nextBillingDate: periodEnd,
            subscriptionId: subscriptionId,
          });

          // Send credits added email
          if (creditsResult.success && 'newBalance' in creditsResult && creditsResult.newBalance !== undefined) {
            await sendCreditsAddedEmail({
              name: user.name || 'User',
              email: user.email,
              credits: plan.creditsPerMonth,
              balance: 'newBalance' in creditsResult ? creditsResult.newBalance : 0,
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

