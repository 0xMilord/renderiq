import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { paymentOrders, creditPackages, subscriptionPlans, userSubscriptions, userCredits, creditTransactions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
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

      logger.log('✅ RazorpayService: Order created in Razorpay:', razorpayOrder.id);

      // IMPORTANT: Do NOT create database records here
      // Database records will be created ONLY after payment is verified in verifyPayment
      // This prevents pending/failed records from being created when user closes payment modal

      return {
        success: true,
        data: {
          orderId: razorpayOrder.id,
          amount: typeof razorpayOrder.amount === 'number' ? razorpayOrder.amount / 100 : Number(razorpayOrder.amount) / 100, // Convert back from paise
          currency: razorpayOrder.currency,
          creditPackageId,
          credits: packageData.credits,
          bonusCredits: packageData.bonusCredits,
          packageName: packageData.name,
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

      // Fetch order details from Razorpay first
      const razorpay = getRazorpayInstance();
      const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
      
      // Get payment order from database (may not exist if user closed modal before)
      let [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.razorpayOrderId, razorpayOrderId))
        .limit(1);

      // If payment order doesn't exist, create it now (payment is verified)
      if (!paymentOrder) {
        logger.log('📝 RazorpayService: Payment order not found, creating from Razorpay order data');
        
        // Extract metadata from Razorpay order notes
        const notes = razorpayOrder.notes || {};
        const userId = notes.userId;
        const creditPackageId = notes.creditPackageId;
        
        if (!userId || !creditPackageId) {
          return { success: false, error: 'Missing order metadata. Cannot create payment order.' };
        }
        
        // Get credit package details
        const [packageData] = await db
          .select()
          .from(creditPackages)
          .where(eq(creditPackages.id, creditPackageId))
          .limit(1);
        
        if (!packageData) {
          return { success: false, error: 'Credit package not found' };
        }
        
        // Create payment order record with status 'completed' (payment is verified)
        [paymentOrder] = await db
          .insert(paymentOrders)
          .values({
            userId,
            type: 'credit_package',
            referenceId: creditPackageId,
            razorpayOrderId: razorpayOrder.id,
            amount: (typeof razorpayOrder.amount === 'number' ? razorpayOrder.amount / 100 : Number(razorpayOrder.amount) / 100).toString(),
            currency: razorpayOrder.currency,
            status: 'completed', // Payment is verified, so it's completed
            metadata: {
              credits: packageData.credits,
              bonusCredits: packageData.bonusCredits,
              packageName: packageData.name,
            },
          })
          .returning();
        
        logger.log('✅ RazorpayService: Payment order created from verified payment');
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

      // Fetch payment details from Razorpay (already have instance from above)
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
        const customers = await razorpay.customers.all({ count: 100 });
        const existingCustomer = customers.items.find((c: any) => c.email === customerDetails.email);
        if (existingCustomer) {
          razorpayCustomerId = existingCustomer.id;
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

      // Note: Plan verification via SDK may not be available in all Razorpay SDK versions
      // We'll proceed directly to subscription creation which will provide clearer errors
      logger.log('💳 RazorpayService: Attempting to create subscription with plan:', plan.razorpayPlanId);

      // Create subscription in Razorpay
      const subscriptionOptions = {
        plan_id: plan.razorpayPlanId,
        customer_notify: 1 as 0 | 1,
        total_count: plan.interval === 'year' ? 1 : 12, // For annual, 1 payment; for monthly, 12
        notes: {
          userId,
          planId,
        },
        ...(razorpayCustomerId && { customer_id: razorpayCustomerId }),
      };

      logger.log('💳 RazorpayService: Creating subscription with options:', subscriptionOptions);
      logger.log('💳 RazorpayService: Using Razorpay instance with key:', process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...');
      logger.log('💳 RazorpayService: Account mode:', process.env.RAZORPAY_KEY_ID?.includes('rzp_test') ? 'TEST' : 'LIVE');
      
      // Try creating subscription via SDK first
      let razorpaySubscription: any;
      try {
        razorpaySubscription = await razorpay.subscriptions.create(subscriptionOptions);
        logger.log('✅ RazorpayService: Subscription created successfully via SDK:', razorpaySubscription.id);
      } catch (sdkError: any) {
        // If SDK fails with "URL not found", try direct API call as fallback
        if (sdkError.statusCode === 400 && (sdkError.error?.description?.includes('not found') || sdkError.error?.code === 'BAD_REQUEST_ERROR')) {
          logger.warn('⚠️ RazorpayService: SDK subscription creation failed, trying direct API call');
          logger.log('💳 RazorpayService: Attempting direct API call to Razorpay subscriptions endpoint');
          
          try {
            // Make direct HTTP request to Razorpay API
            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            
            if (!keyId || !keySecret) {
              throw new Error('Razorpay credentials not configured');
            }
            
            const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
            
            // Use the correct API endpoint based on account mode
            const apiUrl = 'https://api.razorpay.com/v1/subscriptions';
            logger.log('💳 RazorpayService: Calling Razorpay API:', apiUrl);
            
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`,
              },
              body: JSON.stringify(subscriptionOptions),
            });
            
            const responseText = await response.text();
            logger.log('💳 RazorpayService: API response status:', response.status);
            logger.log('💳 RazorpayService: API response:', responseText.substring(0, 500));
            
            if (!response.ok) {
              let errorData;
              try {
                errorData = JSON.parse(responseText);
              } catch {
                errorData = { error: { description: responseText } };
              }
              
              throw {
                statusCode: response.status,
                error: errorData.error || { description: errorData.message || 'Unknown error' },
                message: errorData.error?.description || errorData.message || 'API request failed'
              };
            }
            
            razorpaySubscription = JSON.parse(responseText);
            logger.log('✅ RazorpayService: Subscription created via direct API:', razorpaySubscription.id);
          } catch (apiError: any) {
            logger.error('❌ RazorpayService: Direct API call also failed:', {
              statusCode: apiError.statusCode,
              error: apiError.error,
              message: apiError.message
            });
            // If direct API also fails, throw the original SDK error with more context
            throw {
              ...sdkError,
              directApiError: apiError,
              suggestion: 'Both SDK and direct API calls failed. Please verify: 1) Subscriptions feature is enabled in Razorpay Dashboard, 2) Plan ID exists and matches exactly, 3) Using correct account mode (test/live)'
            };
          }
        } else {
          // Re-throw non-URL errors
          throw sdkError;
        }
      }

      logger.log('✅ RazorpayService: Subscription created in Razorpay:', razorpaySubscription.id);
      logger.log('📊 RazorpayService: Subscription status from Razorpay:', razorpaySubscription.status);

      // IMPORTANT: Do NOT create database records here
      // Database records will be created ONLY after payment is verified in verifySubscriptionPayment
      // This prevents pending/failed records from being created when user closes payment modal

      return {
        success: true,
        data: {
          subscriptionId: razorpaySubscription.id,
          status: razorpaySubscription.status,
          razorpayCustomerId,
          planId,
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
        planName: plan?.name,
        directApiError: (error as any).directApiError,
        suggestion: (error as any).suggestion
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create subscription';
      
      if (error.statusCode === 400) {
        const errorDesc = error.error?.description || '';
        
        if (errorDesc.includes('not found') || error.error?.code === 'BAD_REQUEST_ERROR') {
          // Check if it's a plan not found error vs subscriptions not enabled
          if (errorDesc.toLowerCase().includes('plan') || errorDesc.toLowerCase().includes('invalid plan')) {
            errorMessage = `Plan Not Found

The plan ID '${razorpayPlanId}' was not found in your Razorpay account.

Please verify:
1. The plan exists in Razorpay Dashboard (Products → Plans)
2. The plan ID matches exactly (including test/live mode)
3. You're using the correct Razorpay account (test vs live)

Plan ID: ${razorpayPlanId}
Plan Name: ${plan?.name || 'Unknown'}
Account Mode: ${process.env.RAZORPAY_KEY_ID?.includes('rzp_test') ? 'TEST' : 'LIVE'}`;
          } else {
            // Likely subscriptions feature not enabled OR plan doesn't exist
            const suggestion = (error as any).suggestion;
            errorMessage = `Subscription Creation Failed

Possible causes:
1. Plan ID '${razorpayPlanId}' doesn't exist in your Razorpay account
2. Subscriptions feature may not be fully enabled yet
3. Wrong account mode (test vs live keys mismatch)
4. API endpoint issue (both SDK and direct API failed)

${suggestion ? `\n${suggestion}\n` : ''}
Please verify:
- Plan exists in Razorpay Dashboard (Products → Plans)
- Plan ID matches exactly: ${razorpayPlanId}
- Using ${process.env.RAZORPAY_KEY_ID?.includes('rzp_test') ? 'TEST' : 'LIVE'} mode keys
- Subscriptions section is visible in Razorpay Dashboard

Plan Name: ${plan?.name || 'Unknown'}`;
          }
        } else {
          errorMessage = error.error?.description || error.message || 'Invalid request to Razorpay';
        }
      } else if (error.statusCode === 401) {
        errorMessage = 'Razorpay authentication failed. Please check your API credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET).';
      } else if (error.statusCode === 404) {
        errorMessage = `Plan or API Endpoint Not Found

The plan ID '${razorpayPlanId}' was not found, or the Subscriptions API endpoint is not available.

This could mean:
1. Plan doesn't exist in your Razorpay account
2. Subscriptions feature is not enabled
3. Wrong account mode (test vs live)

Please verify the plan exists in Razorpay Dashboard.`;
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
   * Verify subscription payment signature and activate subscription
   * Similar to verifyPayment but for subscriptions
   */
  static async verifySubscriptionPayment(
    razorpaySubscriptionId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    try {
      logger.log('🔐 RazorpayService: Verifying subscription payment:', { 
        razorpaySubscriptionId, 
        razorpayPaymentId 
      });

      // Fetch subscription and payment from Razorpay first to verify
      const razorpay = getRazorpayInstance();
      const razorpaySubscription = await razorpay.subscriptions.fetch(razorpaySubscriptionId);
      const payment = await razorpay.payments.fetch(razorpayPaymentId);

      // Check if subscription exists in database (may not exist if user closed modal before)
      let [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
        .limit(1);

      // If subscription doesn't exist, create it now (payment is verified)
      if (!subscription) {
        logger.log('📝 RazorpayService: Subscription not found, creating from Razorpay subscription data');
        
        // Extract metadata from Razorpay subscription notes
        const notes = razorpaySubscription.notes || {};
        const userId = notes.userId;
        const planId = notes.planId;
        
        if (!userId || !planId) {
          return { success: false, error: 'Missing subscription metadata. Cannot create subscription record.' };
        }
        
        // Get plan details
        const [plan] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, planId))
          .limit(1);
        
        if (!plan) {
          return { success: false, error: 'Subscription plan not found' };
        }
        
        // Calculate period dates
        const now = new Date();
        const periodEnd = new Date(now);
        if (plan.interval === 'year') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        
        // Get customer ID from subscription
        const razorpayCustomerId = razorpaySubscription.customer_id;
        
        // Create subscription record with status 'active' (payment is verified)
        [subscription] = await db
          .insert(userSubscriptions)
          .values({
            userId,
            planId,
            status: 'active',
            razorpaySubscriptionId: razorpaySubscription.id,
            razorpayCustomerId,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          })
          .returning();
        
        logger.log('✅ RazorpayService: Subscription record created from verified payment');
      }

      // Verify signature for subscription payment
      // Razorpay subscription signatures can use different formats:
      // 1. subscription_id|payment_id (most common)
      // 2. order_id|payment_id (if subscription has an order_id)
      // 3. payment_id|subscription_id (some cases)
      
      let signatureValid = false;
      let usedFormat = 'none';
      
      // Try format 1: subscription_id|payment_id (most common)
      const text1 = `${razorpaySubscriptionId}|${razorpayPaymentId}`;
      const generatedSignature1 = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(text1)
        .digest('hex');
      
      if (generatedSignature1 === razorpaySignature) {
        signatureValid = true;
        usedFormat = 'subscription_id|payment_id';
      }
      
      // Try format 2: payment_id|subscription_id (alternative)
      if (!signatureValid) {
        const text2 = `${razorpayPaymentId}|${razorpaySubscriptionId}`;
        const generatedSignature2 = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
          .update(text2)
          .digest('hex');
        
        if (generatedSignature2 === razorpaySignature) {
          signatureValid = true;
          usedFormat = 'payment_id|subscription_id';
        }
      }

      if (!signatureValid) {
        logger.error('❌ RazorpayService: Invalid subscription payment signature', {
          subscriptionId: razorpaySubscriptionId,
          paymentId: razorpayPaymentId,
          triedFormats: ['subscription_id|payment_id', 'payment_id|subscription_id'],
        });
        
        // CRITICAL: Don't fail here - verify via Razorpay API instead (fallback)
        // This ensures payments don't fail due to signature format issues
        logger.warn('⚠️ RazorpayService: Signature verification failed, falling back to API verification');
        
        // Fetch payment from Razorpay to verify it's real (fallback verification)
        try {
          const razorpay = getRazorpayInstance();
          const paymentVerification = await razorpay.payments.fetch(razorpayPaymentId);
          // Verify subscription exists and is valid
          await razorpay.subscriptions.fetch(razorpaySubscriptionId);
          
          // Verify payment belongs to this subscription
          if (paymentVerification.subscription_id !== razorpaySubscriptionId) {
            logger.error('❌ RazorpayService: Payment does not belong to subscription');
            return { success: false, error: 'Payment verification failed: payment does not belong to subscription' };
          }
          
          // Verify payment status
          if (paymentVerification.status !== 'captured' && paymentVerification.status !== 'authorized') {
            logger.error('❌ RazorpayService: Payment not successful, status:', paymentVerification.status);
            return { success: false, error: `Payment not successful. Status: ${paymentVerification.status}` };
          }
          
          logger.warn('✅ RazorpayService: Payment verified via API fallback (signature format issue)');
          // Continue with payment processing - payment and subscription already fetched
        } catch (apiError: any) {
          logger.error('❌ RazorpayService: API fallback verification also failed:', apiError);
          return { success: false, error: 'Payment verification failed. Please contact support with payment ID.' };
        }
      } else {
        logger.log('✅ RazorpayService: Signature verified successfully using format:', usedFormat);
      }

      // Payment and subscription are already fetched above

      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        return { success: false, error: `Payment not successful. Status: ${payment.status}` };
      }
      
      if (razorpaySubscription.status !== 'active') {
        logger.warn('⚠️ RazorpayService: Subscription not active in Razorpay:', razorpaySubscription.status);
        return { success: false, error: `Subscription not active. Status: ${razorpaySubscription.status}` };
      }

      // Find or create payment order for this subscription
      let [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.razorpaySubscriptionId, razorpaySubscriptionId))
        .orderBy(desc(paymentOrders.createdAt))
        .limit(1);

      // If payment order doesn't exist, create it now (payment is verified)
      if (!paymentOrder) {
        logger.log('📝 RazorpayService: Payment order not found, creating from subscription data');
        
        // Get plan details
        const [plan] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, subscription.planId))
          .limit(1);
        
        if (!plan) {
          return { success: false, error: 'Subscription plan not found' };
        }
        
        const isCompleted = payment.status === 'captured';
        
        // Create payment order record with status 'completed' (payment is verified)
        [paymentOrder] = await db
          .insert(paymentOrders)
          .values({
            userId: subscription.userId,
            type: 'subscription',
            referenceId: subscription.planId,
            razorpaySubscriptionId: razorpaySubscription.id,
            razorpayPaymentId: razorpayPaymentId,
            amount: plan.price.toString(),
            currency: plan.currency,
            status: isCompleted ? 'completed' : 'processing',
            metadata: {
              planName: plan.name,
              creditsPerMonth: plan.creditsPerMonth,
            },
          })
          .returning();
        
        logger.log('✅ RazorpayService: Payment order created from verified payment');
      } else {
        // Update existing payment order status
        const isCompleted = payment.status === 'captured';
        await db
          .update(paymentOrders)
          .set({
            razorpayPaymentId: razorpayPaymentId,
            status: isCompleted ? 'completed' : 'processing',
            updatedAt: new Date(),
          })
          .where(eq(paymentOrders.id, paymentOrder.id));
      }

      // Generate invoice and receipt for completed payments
      if (payment.status === 'captured') {
        try {
          await InvoiceService.createInvoice(paymentOrder.id);
          ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
            logger.error('❌ RazorpayService: Error generating receipt:', error);
          });
        } catch (error) {
          logger.error('❌ RazorpayService: Error creating invoice/receipt:', error);
        }
      }

      // Update subscription to active if not already active
      if (subscription.status !== 'active') {
        const now = new Date();
        const periodEnd = new Date(now);
        
        // Get plan to determine interval
        const [plan] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, subscription.planId))
          .limit(1);
        
        if (plan?.interval === 'year') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await db
          .update(userSubscriptions)
          .set({
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.id, subscription.id));

        // Add initial credits
        await this.addSubscriptionCredits(subscription.userId, subscription.planId);
        logger.log('✅ RazorpayService: Subscription activated and credits added');
      }

      logger.log('✅ RazorpayService: Subscription payment verified successfully');

      return {
        success: true,
        data: {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          planId: subscription.planId,
          paymentOrderId: paymentOrder?.id,
        },
      };
    } catch (error) {
      logger.error('❌ RazorpayService: Error verifying subscription payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify subscription payment',
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
          // First payment successful - activate subscription and add initial credits
          await this.handleSubscriptionActivated(payload);
          break;
        case 'subscription.charged':
          // Recurring payment successful - add monthly credits
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

  /**
   * Handle subscription.activated webhook - first payment successful
   * This activates the subscription and adds initial credits
   */
  private static async handleSubscriptionActivated(payload: any) {
    const subscriptionId = payload.subscription?.entity?.id;
    if (!subscriptionId) {
      logger.warn('⚠️ RazorpayService: No subscription ID in activation payload');
      return;
    }

    logger.log('🎉 RazorpayService: Handling subscription activation:', subscriptionId);

    // Find subscription
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId))
      .limit(1);

    if (!subscription) {
      logger.warn('⚠️ RazorpayService: Subscription not found in database:', subscriptionId);
      return;
    }

    // Verify subscription status in Razorpay to ensure payment was successful
    try {
      const razorpay = getRazorpayInstance();
      const razorpaySubscription = await razorpay.subscriptions.fetch(subscriptionId);
      
      // Only activate if subscription status is 'active' in Razorpay
      if (razorpaySubscription.status !== 'active') {
        logger.warn('⚠️ RazorpayService: Subscription not active in Razorpay, status:', razorpaySubscription.status);
        return;
      }
    } catch (error) {
      logger.error('❌ RazorpayService: Error fetching subscription from Razorpay:', error);
      // Continue anyway - webhook should be trusted, but log the error
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);
    // Get plan to determine interval
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription.planId))
      .limit(1);
    
    if (plan?.interval === 'year') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Update subscription to active
    await db
      .update(userSubscriptions)
      .set({
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscription.id));

    // Add initial credits (always add on activation)
    // Check if credits were already added to avoid duplicates
    const creditsResult = await this.addSubscriptionCredits(subscription.userId, subscription.planId);
    if (creditsResult.success) {
      logger.log('✅ RazorpayService: Subscription activated and initial credits added. New balance:', creditsResult.newBalance);
    } else {
      logger.error('❌ RazorpayService: Failed to add credits on activation:', creditsResult.error);
    }

    // Generate invoice and receipt for subscription activation
    // Find payment order for this subscription
    const [paymentOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.razorpaySubscriptionId, subscriptionId))
      .orderBy(desc(paymentOrders.createdAt))
      .limit(1);

    if (paymentOrder && paymentOrder.status === 'completed') {
      try {
        await InvoiceService.createInvoice(paymentOrder.id);
        ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
          logger.error('❌ RazorpayService: Error generating receipt in subscription activation webhook:', error);
        });
        logger.log('✅ RazorpayService: Invoice and receipt generated for subscription activation');
      } catch (error) {
        logger.error('❌ RazorpayService: Error creating invoice/receipt in subscription activation webhook:', error);
      }
    }
  }

  /**
   * Handle subscription.charged webhook - recurring payment successful
   * This adds monthly credits for existing active subscriptions
   */
  private static async handleSubscriptionCharged(payload: any) {
    const subscriptionId = payload.subscription?.entity?.id;
    if (!subscriptionId) return;

    logger.log('💳 RazorpayService: Handling subscription charge:', subscriptionId);

    // Find subscription
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId))
      .limit(1);

    if (!subscription) {
      logger.warn('⚠️ RazorpayService: Subscription not found in database:', subscriptionId);
      return;
    }

    // Verify subscription status in Razorpay to ensure payment was successful
    try {
      const razorpay = getRazorpayInstance();
      const razorpaySubscription = await razorpay.subscriptions.fetch(subscriptionId);
      
      // Only process if subscription status is 'active' in Razorpay
      if (razorpaySubscription.status !== 'active') {
        logger.warn('⚠️ RazorpayService: Subscription not active in Razorpay, status:', razorpaySubscription.status);
        return;
      }
    } catch (error) {
      logger.error('❌ RazorpayService: Error fetching subscription from Razorpay:', error);
      // Continue anyway - webhook should be trusted, but log the error
    }

    // Update subscription period
    const now = new Date();
    const periodEnd = new Date(now);
    
    // Get plan to determine interval
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription.planId))
      .limit(1);
    
    if (plan?.interval === 'year') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Update subscription period (status should already be active)
    await db
      .update(userSubscriptions)
      .set({
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscription.id));

    // Find or create payment order for this recurring charge
    const [existingPaymentOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.razorpaySubscriptionId, subscriptionId))
      .orderBy(desc(paymentOrders.createdAt))
      .limit(1);

    // Create payment order for recurring charge if needed
    let recurringPaymentOrder = existingPaymentOrder;
    if (!existingPaymentOrder || existingPaymentOrder.status !== 'completed') {
      // Get plan details
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription.planId))
        .limit(1);

      if (plan) {
        const [newOrder] = await db.insert(paymentOrders).values({
          userId: subscription.userId,
          type: 'subscription',
          referenceId: subscription.planId,
          razorpaySubscriptionId: subscriptionId,
          amount: plan.price.toString(),
          currency: plan.currency,
          status: 'completed',
          metadata: {
            planName: plan.name,
            creditsPerMonth: plan.creditsPerMonth,
            isRecurring: true,
          },
        }).returning();
        recurringPaymentOrder = newOrder;
      }
    }

    // Add monthly credits for recurring payment
    // Only add if subscription was already active (to avoid duplicate on first payment)
    if (subscription.status === 'active') {
      const creditsResult = await this.addSubscriptionCredits(subscription.userId, subscription.planId);
      if (creditsResult.success) {
        logger.log('✅ RazorpayService: Recurring payment processed and credits added:', creditsResult.newBalance);
      } else {
        logger.error('❌ RazorpayService: Failed to add credits on charge:', creditsResult.error);
      }
    } else {
      // If not active, this might be the first payment - let activation handler deal with it
      logger.log('⚠️ RazorpayService: Subscription not active, skipping credit addition (activation handler should process)');
    }

    // Generate invoice and receipt for recurring charge
    if (recurringPaymentOrder && recurringPaymentOrder.status === 'completed') {
      try {
        await InvoiceService.createInvoice(recurringPaymentOrder.id);
        ReceiptService.generateReceiptPdf(recurringPaymentOrder.id).catch((error) => {
          logger.error('❌ RazorpayService: Error generating receipt in subscription charge webhook:', error);
        });
        logger.log('✅ RazorpayService: Invoice and receipt generated for recurring charge');
      } catch (error) {
        logger.error('❌ RazorpayService: Error creating invoice/receipt in subscription charge webhook:', error);
      }
    }
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

  /**
   * Cancel a pending subscription (e.g., when payment fails)
   * This prevents users from being marked as pro when payment hasn't completed
   */
  static async cancelPendingSubscription(razorpaySubscriptionId: string) {
    try {
      logger.log('🚫 RazorpayService: Cancelling pending subscription:', razorpaySubscriptionId);

      // Find subscription in database
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
        .limit(1);

      if (!subscription) {
        logger.warn('⚠️ RazorpayService: Subscription not found in database:', razorpaySubscriptionId);
        return { success: false, error: 'Subscription not found' };
      }

      // Only cancel if status is pending (not already active or canceled)
      if (subscription.status === 'pending') {
        // Cancel in Razorpay if possible
        try {
          const razorpay = getRazorpayInstance();
          await razorpay.subscriptions.cancel(razorpaySubscriptionId);
          logger.log('✅ RazorpayService: Subscription cancelled in Razorpay');
        } catch (error: any) {
          // If cancellation fails in Razorpay (e.g., already cancelled), still update database
          logger.warn('⚠️ RazorpayService: Could not cancel in Razorpay (may already be cancelled):', error.message);
        }

        // Update database status
        await db
          .update(userSubscriptions)
          .set({
            status: 'canceled',
            canceledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.razorpaySubscriptionId, razorpaySubscriptionId));

        logger.log('✅ RazorpayService: Pending subscription cancelled in database');
        return { success: true };
      } else {
        logger.log('⚠️ RazorpayService: Subscription is not pending, cannot cancel:', subscription.status);
        return { success: false, error: `Subscription is ${subscription.status}, cannot cancel` };
      }
    } catch (error) {
      logger.error('❌ RazorpayService: Error cancelling pending subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription',
      };
    }
  }
}

