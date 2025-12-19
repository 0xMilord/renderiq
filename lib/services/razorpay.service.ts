import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { paymentOrders, creditPackages, subscriptionPlans, userSubscriptions, userCredits, creditTransactions, invoices, ambassadorCommissions, users } from '@/lib/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
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

      // ✅ OPTIMIZED: Fetch from Razorpay and check DB in parallel
      const razorpay = getRazorpayInstance();
      const [razorpayOrder, existingPaymentOrderResult] = await Promise.all([
        razorpay.orders.fetch(razorpayOrderId),
        db
          .select()
          .from(paymentOrders)
          .where(eq(paymentOrders.razorpayOrderId, razorpayOrderId))
          .limit(1),
      ]);
      
      // Get payment order from database (may not exist if user closed modal before)
      let [paymentOrder] = existingPaymentOrderResult;

      // If payment order doesn't exist, create it now (payment is verified)
      if (!paymentOrder) {
        logger.log('📝 RazorpayService: Payment order not found, creating from Razorpay order data');
        
        // Extract metadata from Razorpay order notes
        const notes = razorpayOrder.notes || {};
        const userId: string = String(notes.userId || '');
        const creditPackageId: string = String(notes.creditPackageId || '');
        
        if (!userId || !creditPackageId) {
          return { success: false, error: 'Missing order metadata. Cannot create payment order.' };
        }
        
        // ✅ OPTIMIZED: Fetch package data (can't parallelize with razorpayOrder since we need notes first)
        // But we can parallelize with payment fetch if needed
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

      // ✅ OPTIMIZED: Verify signature and fetch payment in parallel (both are independent)
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        logger.error('❌ RazorpayService: Invalid payment signature');
        return { success: false, error: 'Invalid payment signature' };
      }

      // Fetch payment details from Razorpay (can be done in parallel with signature verification if needed)
      // But signature verification is fast, so keeping sequential is fine
      const payment = await razorpay.payments.fetch(razorpayPaymentId);

      // CRITICAL: Only accept fully captured payments (not authorized/pending)
      // This ensures we only record positive and fully completed payments
      if (payment.status !== 'captured') {
        logger.warn('⚠️ RazorpayService: Payment not captured yet, status:', payment.status);
        return { success: false, error: `Payment not fully completed. Status: ${payment.status}. Please wait for payment to be captured.` };
      }

      // Extract payment method information from Razorpay payment object
      const paymentMethod = payment.method || 'unknown';
      const paymentMethodDetails: any = {
        method: paymentMethod,
      };

      // Add method-specific details
      if (paymentMethod === 'card' && payment.card) {
        paymentMethodDetails.card = {
          last4: payment.card.last4,
          network: payment.card.network,
          type: payment.card.type,
        };
      } else if (paymentMethod === 'upi' && payment.vpa) {
        paymentMethodDetails.vpa = payment.vpa;
      } else if (paymentMethod === 'wallet' && payment.wallet) {
        paymentMethodDetails.wallet = payment.wallet;
      } else if (paymentMethod === 'netbanking' && payment.bank) {
        paymentMethodDetails.bank = payment.bank;
      }

      // Update payment order status to completed (payment is fully captured)
      // Also store payment method in metadata
      await db
        .update(paymentOrders)
        .set({
          razorpayPaymentId: razorpayPaymentId,
          status: 'completed',
          metadata: {
            ...(paymentOrder.metadata || {}),
            paymentMethod: paymentMethodDetails,
          },
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, paymentOrder.id));

      // Add credits only for fully captured payments
      // ✅ Pass payment order ID for idempotency check
      if (paymentOrder.type === 'credit_package' && paymentOrder.referenceId) {
        const creditsResult = await this.addCreditsToAccount(paymentOrder.userId, paymentOrder.referenceId, paymentOrder.id);
        if (!creditsResult.success) {
          logger.error('❌ RazorpayService: Failed to add credits after payment verification:', creditsResult.error);
        }
      }

      // Generate invoice and receipt for completed payments
      try {
        // Create invoice
        const invoiceResult = await InvoiceService.createInvoice(paymentOrder.id);
        if (invoiceResult.success) {
          logger.log('✅ RazorpayService: Invoice created:', invoiceResult.data?.id);
          // Generate receipt PDF (async, don't block)
          ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
            logger.error('❌ RazorpayService: Error generating receipt:', error);
          });
          // Send receipt email (async, don't block)
          ReceiptService.sendReceiptEmail(paymentOrder.id).catch((error) => {
            logger.error('❌ RazorpayService: Error sending receipt email:', error);
          });
        } else {
          logger.error('❌ RazorpayService: Failed to create invoice:', invoiceResult.error);
        }
      } catch (error) {
        logger.error('❌ RazorpayService: Error creating invoice/receipt:', error);
        // Don't fail the payment verification if invoice/receipt generation fails
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
    creditPackageId: string,
    paymentOrderId?: string
  ) {
    try {
      logger.log('💰 RazorpayService: Adding credits to account:', { userId, creditPackageId, paymentOrderId });

      // ✅ IMPROVED IDEMPOTENCY: Check if credits already added for this specific payment order
      if (paymentOrderId) {
        const [paymentOrder] = await db
          .select()
          .from(paymentOrders)
          .where(eq(paymentOrders.id, paymentOrderId))
          .limit(1);

        if (paymentOrder) {
          // Check if credit transaction exists for this payment order
          // We check if a transaction was created after the payment order was created
          const [existingTransaction] = await db
            .select()
            .from(creditTransactions)
            .where(
              and(
                eq(creditTransactions.userId, userId),
                eq(creditTransactions.referenceId, creditPackageId),
                eq(creditTransactions.referenceType, 'credit_package'),
                eq(creditTransactions.type, 'earned'),
                gte(creditTransactions.createdAt, new Date(paymentOrder.createdAt))
              )
            )
            .orderBy(desc(creditTransactions.createdAt))
            .limit(1);

          if (existingTransaction) {
            logger.warn('⚠️ RazorpayService: Credits already added for this payment order, skipping duplicate:', {
              userId,
              creditPackageId,
              paymentOrderId,
              existingTransactionId: existingTransaction.id,
            });
            const [userCredit] = await db
              .select()
              .from(userCredits)
              .where(eq(userCredits.userId, userId))
              .limit(1);
            return {
              success: true,
              data: {
                creditsAdded: 0,
                newBalance: userCredit?.balance || 0,
                skipped: true,
                reason: 'Credits already added for this payment order',
              },
            };
          }
        }
      }

      // ✅ OPTIMIZED: Fetch package and check user credits in parallel
      const [packageDataResult, existingCreditResult] = await Promise.all([
        db
          .select()
          .from(creditPackages)
          .where(eq(creditPackages.id, creditPackageId))
          .limit(1),
        db
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, userId))
          .limit(1),
      ]);

      const [packageData] = packageDataResult;
      if (!packageData) {
        return { success: false, error: 'Credit package not found' };
      }

      const totalCredits = packageData.credits + packageData.bonusCredits;

      // Get or create user credits record
      let [userCredit] = existingCreditResult;
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

      // ✅ OPTIMIZED: Update credits and create transaction in parallel (both are independent)
      const newBalance = userCredit.balance + totalCredits;
      await Promise.all([
        // Update credits balance
        db
          .update(userCredits)
          .set({
            balance: newBalance,
            totalEarned: userCredit.totalEarned + totalCredits,
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, userId)),
        // Create transaction record (can be done in parallel)
        db.insert(creditTransactions).values({
          userId,
          amount: totalCredits,
          type: 'earned',
          description: `Purchased ${packageData.name} - ${packageData.credits} credits${packageData.bonusCredits > 0 ? ` + ${packageData.bonusCredits} bonus` : ''}`,
          referenceId: creditPackageId,
          referenceType: 'credit_package', // ✅ FIXED: Use correct reference type for credit packages
        }),
      ]);

      logger.log('✅ RazorpayService: Credits added successfully:', { totalCredits, newBalance });

      // Send credits added email notification
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
            balance: newBalance,
            reason: `Purchased ${packageData.name}`,
            transactionId: paymentOrderId,
          });
        }
      } catch (error) {
        logger.error('❌ RazorpayService: Failed to send credits added email:', error);
        // Don't fail credit addition if email fails
      }

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
    },
    currencyMetadata?: {
      requestedCurrency?: string;
      convertedAmount?: number;
      originalAmount?: number;
      originalCurrency?: string;
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

      // ✅ FIXED: Check for ambassador referral and calculate discount BEFORE creating subscription
      let discountAmount = 0;
      let discountPercentage = 0;
      let originalAmount = parseFloat(plan.price.toString());
      let referralData = null;
      let ambassadorId: string | undefined;
      
      try {
        const { AmbassadorDAL } = await import('@/lib/dal/ambassador');
        referralData = await AmbassadorDAL.getReferralByUserId(userId);
        
        if (referralData && referralData.ambassador.status === 'active') {
          ambassadorId = referralData.ambassador.id;
          discountPercentage = parseFloat(referralData.ambassador.discountPercentage.toString());
          discountAmount = (originalAmount * discountPercentage) / 100;
          
          logger.log('💰 RazorpayService: Ambassador discount applied:', {
            ambassadorId,
            discountPercentage,
            discountAmount,
            originalAmount,
            netAmount: originalAmount - discountAmount,
          });
        }
      } catch (error) {
        logger.warn('⚠️ RazorpayService: Error checking ambassador referral:', error);
        // Continue without discount if ambassador check fails
      }

      // Create subscription in Razorpay
      // Note: Razorpay subscriptions use the plan's pre-configured currency
      // Currency metadata is stored in notes for reference
      const subscriptionOptions: any = {
        plan_id: plan.razorpayPlanId,
        customer_notify: 1 as 0 | 1,
        total_count: plan.interval === 'year' ? 1 : 12, // For annual, 1 payment; for monthly, 12
        notes: {
          userId,
          planId,
          ...(currencyMetadata && {
            requestedCurrency: currencyMetadata.requestedCurrency,
            convertedAmount: currencyMetadata.convertedAmount,
            originalAmount: currencyMetadata.originalAmount,
            originalCurrency: currencyMetadata.originalCurrency,
          }),
          // Store ambassador discount info in notes for webhook handlers
          ...(discountAmount > 0 && {
            ambassadorDiscount: discountAmount.toString(),
            ambassadorDiscountPercentage: discountPercentage.toString(),
            ambassadorId,
            originalAmount: originalAmount.toString(),
          }),
        },
        ...(razorpayCustomerId && { customer_id: razorpayCustomerId }),
      };

      // ✅ FIXED: Store discount info in notes for webhook handlers
      // Note: Razorpay subscriptions use plan price directly, so discount is applied
      // in payment orders via webhooks. The discount info is stored here for consistency.
      if (discountAmount > 0) {
        logger.log('💰 RazorpayService: Discount will be applied in payment orders:', {
          discountAmount,
          discountPercentage,
          originalAmount,
          netAmount: originalAmount - discountAmount,
        });
      }

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

      // ✅ OPTIMIZED: Fetch from Razorpay and check DB in parallel
      const razorpay = getRazorpayInstance();
      const [razorpaySubscription, payment, existingSubscriptionResult] = await Promise.all([
        razorpay.subscriptions.fetch(razorpaySubscriptionId),
        razorpay.payments.fetch(razorpayPaymentId),
        db
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
          .limit(1),
      ]);

      // Check if subscription exists in database (may not exist if user closed modal before)
      let [subscription] = existingSubscriptionResult;

      // If subscription doesn't exist, create it now (payment is verified)
      let cachedPlan: any = null; // Store plan for reuse
      if (!subscription) {
        logger.log('📝 RazorpayService: Subscription not found, creating from Razorpay subscription data');
        
        // Extract metadata from Razorpay subscription notes
        const notes = razorpaySubscription.notes || {};
        const userId: string = String(notes.userId || '');
        const planId: string = String(notes.planId || '');
        
        if (!userId || !planId) {
          return { success: false, error: 'Missing subscription metadata. Cannot create subscription record.' };
        }
        
        // Get plan details (will reuse for payment order creation)
        const [planResult] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, planId))
          .limit(1);
        
        if (!planResult) {
          return { success: false, error: 'Subscription plan not found' };
        }
        
        cachedPlan = planResult;
        
        // Calculate period dates
        const now = new Date();
        const periodEnd = new Date(now);
        if (cachedPlan.interval === 'year') {
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
          
          // For subscriptions, accept both "authorized" and "captured" status
          if (paymentVerification.status !== 'captured' && paymentVerification.status !== 'authorized') {
            logger.error('❌ RazorpayService: Payment not in valid state, status:', paymentVerification.status);
            return { success: false, error: `Payment not in valid state. Status: ${paymentVerification.status}. Please wait for payment to be authorized/captured.` };
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

      // For subscriptions, Razorpay auto-captures payments, so "authorized" status is valid
      // The payment will be captured automatically by Razorpay, and we'll get a webhook
      // Accept both "authorized" and "captured" for subscriptions
      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        logger.warn('⚠️ RazorpayService: Payment not in valid state, status:', payment.status);
        return { success: false, error: `Payment not in valid state. Status: ${payment.status}. Please wait for payment to be authorized/captured.` };
      }
      
      // Log if payment is authorized (will be captured by webhook)
      if (payment.status === 'authorized') {
        logger.log('📝 RazorpayService: Payment is authorized (will be auto-captured by Razorpay for subscriptions)');
      }
      
      // For subscriptions, accept "created" or "active" status
      // "created" means subscription created but payment pending
      // "active" means payment successful and subscription active
      // We should create payment order even if subscription is "created" (payment is authorized)
      if (razorpaySubscription.status !== 'active' && razorpaySubscription.status !== 'created') {
        logger.warn('⚠️ RazorpayService: Subscription not in valid state in Razorpay:', razorpaySubscription.status);
        return { success: false, error: `Subscription not in valid state. Status: ${razorpaySubscription.status}` };
      }

      // Extract payment method information from Razorpay payment object
      const paymentMethod = payment.method || 'unknown';
      const paymentMethodDetails: any = {
        method: paymentMethod,
      };

      // Add method-specific details
      if (paymentMethod === 'card' && payment.card) {
        paymentMethodDetails.card = {
          last4: payment.card.last4,
          network: payment.card.network,
          type: payment.card.type,
        };
      } else if (paymentMethod === 'upi' && payment.vpa) {
        paymentMethodDetails.vpa = payment.vpa;
      } else if (paymentMethod === 'wallet' && payment.wallet) {
        paymentMethodDetails.wallet = payment.wallet;
      } else if (paymentMethod === 'netbanking' && payment.bank) {
        paymentMethodDetails.bank = payment.bank;
      }

      // CRITICAL: Always create payment order if payment is authorized/captured
      // This ensures payment orders are recorded even if subscription status is "created"
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
        
        // ✅ OPTIMIZED: Reuse cachedPlan if we already fetched it, otherwise fetch it
        if (!cachedPlan) {
          const [planResult] = await db
            .select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, subscription.planId))
            .limit(1);
          
          if (!planResult) {
            logger.error('❌ RazorpayService: Plan not found for subscription:', subscription.planId);
            return { success: false, error: 'Subscription plan not found' };
          }
          
          cachedPlan = planResult;
        }
        
        try {
          // Create payment order record with status 'completed' (payment is authorized/captured)
          [paymentOrder] = await db
            .insert(paymentOrders)
            .values({
              userId: subscription.userId,
              type: 'subscription',
              referenceId: subscription.planId,
              razorpaySubscriptionId: razorpaySubscription.id,
              razorpayPaymentId: razorpayPaymentId,
              amount: cachedPlan.price.toString(),
              currency: cachedPlan.currency || 'INR',
              status: 'completed', // Payment is authorized/captured, so it's completed
              metadata: {
                planName: cachedPlan.name,
                creditsPerMonth: cachedPlan.creditsPerMonth,
                paymentMethod: paymentMethodDetails,
              },
            })
            .returning();
          
          logger.log('✅ RazorpayService: Payment order created from verified payment:', paymentOrder?.id);
        } catch (error: any) {
          logger.error('❌ RazorpayService: Error creating payment order:', error);
          // Don't fail verification if payment order creation fails, but log it
          return { success: false, error: `Failed to create payment order: ${error.message}` };
        }
      } else {
        // Update existing payment order status to completed
        await db
          .update(paymentOrders)
          .set({
            razorpayPaymentId: razorpayPaymentId,
            status: 'completed', // Payment is captured/authorized, so it's completed
            metadata: {
              ...(paymentOrder.metadata || {}),
              paymentMethod: paymentMethodDetails,
            },
            updatedAt: new Date(),
          })
          .where(eq(paymentOrders.id, paymentOrder.id));
        
        // Create invoice and receipt if not already created
        try {
          const [existingInvoice] = await db
            .select()
            .from(invoices)
            .where(eq(invoices.paymentOrderId, paymentOrder.id))
            .limit(1);
          
          if (!existingInvoice) {
            const invoiceResult = await InvoiceService.createInvoice(paymentOrder.id);
            if (invoiceResult.success) {
              logger.log('✅ RazorpayService: Invoice created in verifySubscriptionPayment:', invoiceResult.data?.id);
              ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
                logger.error('❌ RazorpayService: Error generating receipt:', error);
              });
              // Send receipt email (async, don't block)
              ReceiptService.sendReceiptEmail(paymentOrder.id).catch((error) => {
                logger.error('❌ RazorpayService: Error sending receipt email:', error);
              });
            } else {
              logger.error('❌ RazorpayService: Failed to create invoice in verifySubscriptionPayment:', invoiceResult.error);
            }
          } else {
            logger.log('📄 RazorpayService: Invoice already exists for payment order:', paymentOrder.id);
          }
        } catch (error) {
          logger.error('❌ RazorpayService: Error creating invoice/receipt in verifySubscriptionPayment:', error);
        }
        
        logger.log('✅ RazorpayService: Payment order status updated to completed');
      }

      // Generate invoice and receipt for completed payments (if not already created above)
      if (paymentOrder) {
        try {
          const [existingInvoice] = await db
            .select()
            .from(invoices)
            .where(eq(invoices.paymentOrderId, paymentOrder.id))
            .limit(1);
          
          if (!existingInvoice) {
            const invoiceResult = await InvoiceService.createInvoice(paymentOrder.id);
            if (invoiceResult.success) {
              logger.log('✅ RazorpayService: Invoice created in verifySubscriptionPayment:', invoiceResult.data?.id);
              ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
                logger.error('❌ RazorpayService: Error generating receipt:', error);
              });
              // Send receipt email (async, don't block)
              ReceiptService.sendReceiptEmail(paymentOrder.id).catch((error) => {
                logger.error('❌ RazorpayService: Error sending receipt email:', error);
              });
            } else {
              logger.error('❌ RazorpayService: Failed to create invoice in verifySubscriptionPayment:', invoiceResult.error);
            }
          } else {
            logger.log('📄 RazorpayService: Invoice already exists for payment order:', paymentOrder.id);
          }
        } catch (error) {
          logger.error('❌ RazorpayService: Error creating invoice/receipt:', error);
          // Don't fail the payment verification if invoice/receipt generation fails
        }
      }

      // Update subscription to active if not already active
      const now = new Date();
      const periodEnd = new Date(now);
      
      // ✅ OPTIMIZED: Reuse cachedPlan if available, otherwise fetch
      if (!cachedPlan) {
        const [planResult] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, subscription.planId))
          .limit(1);
        cachedPlan = planResult;
      }
      
      if (cachedPlan?.interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Update subscription status to active if payment is authorized/captured
      // Even if subscription status in Razorpay is "created", we can activate it if payment is authorized
      if (payment.status === 'authorized' || payment.status === 'captured') {
        await db
          .update(userSubscriptions)
          .set({
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.id, subscription.id));

        logger.log('✅ RazorpayService: Subscription status updated to active');
      }

      // CRITICAL: Always add credits when payment is verified (even if subscription was already active)
      // This ensures credits are added on first payment and any subsequent verifications
      // ✅ Pass payment order ID for idempotency check
      const creditsResult = await this.addSubscriptionCredits(
        subscription.userId, 
        subscription.planId,
        paymentOrder?.id
      );
      let creditsAdded = false;
      let newBalance = 0;
      
      if (creditsResult.success) {
        creditsAdded = true;
        newBalance = creditsResult.newBalance || 0;
        logger.log('✅ RazorpayService: Credits added successfully. New balance:', newBalance);
      } else {
        logger.error('❌ RazorpayService: Failed to add credits:', creditsResult.error);
        // Don't fail the verification, but log the error
        // Get current balance even if credits addition failed
        const [userCredit] = await db
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, subscription.userId))
          .limit(1);
        newBalance = userCredit?.balance || 0;
      }

      logger.log('✅ RazorpayService: Subscription payment verified successfully');

      return {
        success: true,
        data: {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          planId: subscription.planId,
          paymentOrderId: paymentOrder?.id,
          creditsAdded,
          newBalance,
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
  static async addSubscriptionCredits(userId: string, planId: string, paymentOrderId?: string) {
    try {
      // ✅ IMPROVED IDEMPOTENCY: Check if credits already added for this specific payment order
      if (paymentOrderId) {
        const [paymentOrder] = await db
          .select()
          .from(paymentOrders)
          .where(eq(paymentOrders.id, paymentOrderId))
          .limit(1);

        if (paymentOrder) {
          // Check if credit transaction exists for this payment order
          // We check if a transaction was created after the payment order was created
          const [existingTransaction] = await db
            .select()
            .from(creditTransactions)
            .where(
              and(
                eq(creditTransactions.userId, userId),
                eq(creditTransactions.referenceId, planId),
                eq(creditTransactions.referenceType, 'subscription'),
                eq(creditTransactions.type, 'earned'),
                gte(creditTransactions.createdAt, new Date(paymentOrder.createdAt))
              )
            )
            .orderBy(desc(creditTransactions.createdAt))
            .limit(1);

          if (existingTransaction) {
            logger.warn('⚠️ RazorpayService: Credits already added for this payment order, skipping duplicate:', {
              userId,
              planId,
              paymentOrderId,
              existingTransactionId: existingTransaction.id,
            });
            const [userCredit] = await db
              .select()
              .from(userCredits)
              .where(eq(userCredits.userId, userId))
              .limit(1);
            return { success: true, newBalance: userCredit?.balance || 0, alreadyAdded: true };
          }
        }
      }

      // ✅ OPTIMIZED: Fetch plan and check user credits in parallel
      const [planResult, existingCreditResult] = await Promise.all([
        db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, planId))
          .limit(1),
        db
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, userId))
          .limit(1),
      ]);

      const [plan] = planResult;
      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      // Get or create user credits record
      let [userCredit] = existingCreditResult;
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

      // ✅ OPTIMIZED: Update credits and create transaction in parallel
      const newBalance = userCredit.balance + plan.creditsPerMonth;
      await Promise.all([
        // Update credits balance
        db
          .update(userCredits)
          .set({
            balance: newBalance,
            totalEarned: userCredit.totalEarned + plan.creditsPerMonth,
            updatedAt: new Date(),
          })
          .where(eq(userCredits.userId, userId)),
        // Create transaction record (can be done in parallel)
        db.insert(creditTransactions).values({
          userId,
          amount: plan.creditsPerMonth,
          type: 'earned',
          description: `Monthly credits for ${plan.name} subscription`,
          referenceId: planId,
          referenceType: 'subscription',
        }),
      ]);

      logger.log('✅ RazorpayService: Credits added successfully:', { amount: plan.creditsPerMonth, newBalance });

      // Send credits added email notification
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
            credits: plan.creditsPerMonth,
            balance: newBalance,
            reason: `Monthly credits for ${plan.name} subscription`,
            transactionId: paymentOrderId,
          });
        }
      } catch (error) {
        logger.error('❌ RazorpayService: Failed to send subscription credits email:', error);
        // Don't fail credit addition if email fails
      }

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
        case 'payment.authorized':
          // Payment authorized - for subscriptions, this means payment is valid and will be auto-captured
          await this.handlePaymentAuthorized(payload);
          break;
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

  /**
   * Handle payment.authorized webhook - payment authorized (for subscriptions, this means payment is valid)
   * For subscriptions, Razorpay auto-captures authorized payments, so we can activate the subscription
   */
  private static async handlePaymentAuthorized(payload: any) {
    const paymentId = payload.payment?.entity?.id;
    const subscriptionId = payload.payment?.entity?.subscription_id;
    
    // Only handle subscription payments here (credit packages use payment.captured)
    if (!subscriptionId || !paymentId) return;
    
    logger.log('💳 RazorpayService: Handling payment.authorized webhook for subscription:', subscriptionId);
    
    try {
      // ✅ OPTIMIZED: Check DB and fetch from Razorpay in parallel
      const razorpay = getRazorpayInstance();
      const [existingSubscriptionResult, razorpaySubscription] = await Promise.all([
        db
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId))
          .limit(1),
        razorpay.subscriptions.fetch(subscriptionId),
      ]);
      
      // Find subscription
      let [subscription] = existingSubscriptionResult;
      
      // If subscription doesn't exist, create it from Razorpay data
      if (!subscription) {
        logger.log('📝 RazorpayService: Subscription not found in database, creating from Razorpay data');
        
        // Extract metadata from Razorpay subscription notes
        const notes = razorpaySubscription.notes || {};
        const userId: string = String(notes.userId || '');
        const planId: string = String(notes.planId || '');
        
        if (!userId || !planId) {
          logger.error('❌ RazorpayService: Missing subscription metadata in payment.authorized webhook');
          return;
        }
        
        // Get plan details
        const [plan] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, planId))
          .limit(1);
        
        if (!plan) {
          logger.error('❌ RazorpayService: Plan not found for subscription:', planId);
          return;
        }
        
        // Calculate period dates
        const now = new Date();
        const periodEnd = new Date(now);
        if (plan.interval === 'year') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        
        // Create subscription record
        const [newSubscription] = await db
          .insert(userSubscriptions)
          .values({
            userId,
            planId,
            status: 'active',
            razorpaySubscriptionId: subscriptionId,
            razorpayCustomerId: razorpaySubscription.customer_id,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          })
          .returning();
        
        subscription = newSubscription;
        logger.log('✅ RazorpayService: Subscription created from payment.authorized webhook');
      }
      
      // CRITICAL: Always create payment order and process if payment is authorized/captured
      // Don't check subscription status - payment order should be created when payment is valid
      // Check if payment is authorized or captured by fetching it
      let shouldProcess = false;
      try {
        const payment = await razorpay.payments.fetch(paymentId);
        shouldProcess = payment.status === 'authorized' || payment.status === 'captured';
        logger.log('💳 RazorpayService: Payment status check:', { paymentId, status: payment.status, shouldProcess });
      } catch (error) {
        logger.error('❌ RazorpayService: Error fetching payment in webhook:', error);
        // If we can't fetch payment, still try to process if subscription is active
        shouldProcess = razorpaySubscription.status === 'active';
      }
      
      if (shouldProcess) {
        // ✅ OPTIMIZED: Fetch plan once and use for both subscription update and payment order
        const [planResult] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, subscription.planId))
          .limit(1);
        
        if (!planResult) {
          logger.error('❌ RazorpayService: Plan not found for subscription:', subscription.planId);
          return;
        }
        
        const plan = planResult;
        
        // Update subscription to active if not already
        if (subscription.status !== 'active') {
          const now = new Date();
          const periodEnd = new Date(now);
          
          if (plan.interval === 'year') {
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
        }
        
        // CRITICAL: Always create payment order if it doesn't exist, regardless of subscription status
        // Payment order should be created when payment is authorized/captured
        let [paymentOrder] = await db
          .select()
          .from(paymentOrders)
          .where(eq(paymentOrders.razorpaySubscriptionId, subscriptionId))
          .orderBy(desc(paymentOrders.createdAt))
          .limit(1);
        
        if (!paymentOrder) {
          logger.log('📝 RazorpayService: Payment order not found, creating in payment.authorized webhook');
          
          // Fetch payment details to get amount and payment method
          let payment;
          try {
            payment = await razorpay.payments.fetch(paymentId);
          } catch (error) {
            logger.error('❌ RazorpayService: Error fetching payment in payment.authorized webhook:', error);
            return; // Can't create payment order without payment details
          }
          
          // Extract payment method information
          const paymentMethod = payment.method || 'unknown';
          const paymentMethodDetails: any = {
            method: paymentMethod,
          };

          // Add method-specific details
          if (paymentMethod === 'card' && payment.card) {
            paymentMethodDetails.card = {
              last4: payment.card.last4,
              network: payment.card.network,
              type: payment.card.type,
            };
          } else if (paymentMethod === 'upi' && payment.vpa) {
            paymentMethodDetails.vpa = payment.vpa;
          } else if (paymentMethod === 'wallet' && payment.wallet) {
            paymentMethodDetails.wallet = payment.wallet;
          } else if (paymentMethod === 'netbanking' && payment.bank) {
            paymentMethodDetails.bank = payment.bank;
          }
          
          try {
            // ✅ FIXED: Check for ambassador referral and calculate discount
            // First, try to get discount from subscription notes (stored at creation)
            let discountAmount = 0;
            let discountPercentage = 0;
            let originalAmount = parseFloat(plan.price.toString());
            let referralData = null;
            
            // Try to get discount from Razorpay subscription notes if available
            try {
              const razorpaySubscription = await razorpay.subscriptions.fetch(subscriptionId);
              const notes = razorpaySubscription.notes || {};
              
              if (notes.ambassadorDiscount && notes.originalAmount) {
                discountAmount = parseFloat(notes.ambassadorDiscount);
                discountPercentage = parseFloat(notes.ambassadorDiscountPercentage || '0');
                originalAmount = parseFloat(notes.originalAmount);
                logger.log('💰 RazorpayService: Using discount from subscription notes in payment.authorized:', {
                  discountAmount,
                  discountPercentage,
                  originalAmount,
                });
              }
            } catch (error) {
              logger.warn('⚠️ RazorpayService: Could not fetch subscription notes in payment.authorized:', error);
            }
            
            // If discount not found in notes, calculate from referral data
            if (discountAmount === 0) {
              try {
                const { AmbassadorDAL } = await import('@/lib/dal/ambassador');
                referralData = await AmbassadorDAL.getReferralByUserId(subscription.userId);
                
                if (referralData && referralData.ambassador.status === 'active') {
                  discountPercentage = parseFloat(referralData.ambassador.discountPercentage.toString());
                  discountAmount = (originalAmount * discountPercentage) / 100;
                  logger.log('💰 RazorpayService: Calculated discount from referral data in payment.authorized:', {
                    discountAmount,
                    discountPercentage,
                    originalAmount,
                  });
                }
              } catch (error) {
                logger.warn('⚠️ RazorpayService: Error checking ambassador referral in payment.authorized:', error);
              }
            } else {
              // Get referral data for commission processing
              try {
                const { AmbassadorDAL } = await import('@/lib/dal/ambassador');
                referralData = await AmbassadorDAL.getReferralByUserId(subscription.userId);
              } catch (error) {
                logger.warn('⚠️ RazorpayService: Error getting referral data for commission:', error);
              }
            }

            // Create payment order
            [paymentOrder] = await db
              .insert(paymentOrders)
              .values({
                userId: subscription.userId,
                type: 'subscription',
                referenceId: subscription.planId,
                razorpaySubscriptionId: subscriptionId,
                razorpayPaymentId: paymentId,
                amount: (originalAmount - discountAmount).toString(), // Net amount after discount
                discountAmount: discountAmount.toString(),
                currency: plan.currency || 'INR',
                status: 'completed', // Payment is authorized, will be captured
                metadata: {
                  planName: plan.name,
                  creditsPerMonth: plan.creditsPerMonth,
                  paymentMethod: paymentMethodDetails,
                  originalAmount: originalAmount,
                  discountAmount: discountAmount,
                },
              })
              .returning();
            
            logger.log('✅ RazorpayService: Payment order created in payment.authorized webhook:', paymentOrder?.id);
            
            // Process commission for ambassador after payment order is created
            if (referralData && referralData.ambassador.status === 'active' && discountAmount > 0 && paymentOrder) {
              try {
                const { AmbassadorService } = await import('@/lib/services/ambassador.service');
                await AmbassadorService.processSubscriptionPayment(
                  subscription.userId,
                  subscription.id,
                  paymentOrder.id,
                  originalAmount,
                  discountAmount,
                  subscription.currentPeriodStart,
                  subscription.currentPeriodEnd,
                  plan.currency || 'USD'
                );
              } catch (error) {
                logger.warn('⚠️ RazorpayService: Error processing ambassador commission in payment.authorized:', error);
              }
            }
            
            // Create invoice and receipt immediately
            try {
              const invoiceResult = await InvoiceService.createInvoice(paymentOrder.id);
              if (invoiceResult.success) {
                logger.log('✅ RazorpayService: Invoice created in payment.authorized webhook:', invoiceResult.data?.id);
                ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
                  logger.error('❌ RazorpayService: Error generating receipt in payment.authorized webhook:', error);
                });
                // Send receipt email (async, don't block)
                ReceiptService.sendReceiptEmail(paymentOrder.id).catch((error) => {
                  logger.error('❌ RazorpayService: Error sending receipt email in payment.authorized webhook:', error);
                });
              } else {
                logger.error('❌ RazorpayService: Failed to create invoice in payment.authorized webhook:', invoiceResult.error);
              }
            } catch (error) {
              logger.error('❌ RazorpayService: Error creating invoice/receipt in payment.authorized webhook:', error);
            }
          } catch (error: any) {
            logger.error('❌ RazorpayService: Error creating payment order in payment.authorized webhook:', error);
            return; // Can't continue without payment order
          }
        }
        
        // ✅ REMOVED: Credit addition - credits are added by verification (app), not webhooks
        // Webhooks only verify and update status, app handles credit addition
      } else {
        logger.warn('⚠️ RazorpayService: Payment not authorized/captured, skipping payment order creation. Payment status check failed.');
      }
    } catch (error) {
      logger.error('❌ RazorpayService: Error handling payment.authorized webhook:', error);
    }
  }

  private static async handlePaymentCaptured(payload: any) {
    const paymentId = payload.payment?.entity?.id;
    const orderId = payload.payment?.entity?.order_id;
    const subscriptionId = payload.payment?.entity?.subscription_id;

    if (!paymentId) return;

    // Handle subscription payments differently
    if (subscriptionId) {
      // For subscriptions, payment.captured means the authorized payment was captured
      // The subscription should already be activated by payment.authorized or subscription.activated
      logger.log('💳 RazorpayService: Payment captured for subscription:', subscriptionId);
      
      // Find or create payment order
      let [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.razorpaySubscriptionId, subscriptionId))
        .orderBy(desc(paymentOrders.createdAt))
        .limit(1);
      
      // If payment order doesn't exist, create it
      if (!paymentOrder) {
        // Find subscription to get plan details
        const [subscription] = await db
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId))
          .limit(1);
        
        if (subscription) {
          const [plan] = await db
            .select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, subscription.planId))
            .limit(1);
          
          if (plan) {
            [paymentOrder] = await db
              .insert(paymentOrders)
              .values({
                userId: subscription.userId,
                type: 'subscription',
                referenceId: subscription.planId,
                razorpaySubscriptionId: subscriptionId,
                razorpayPaymentId: paymentId,
                amount: plan.price.toString(),
                currency: plan.currency || 'INR',
                status: 'completed',
                metadata: {
                  planName: plan.name,
                  creditsPerMonth: plan.creditsPerMonth,
                },
              })
              .returning();
            
            logger.log('✅ RazorpayService: Payment order created in payment.captured webhook');
          }
        }
      }
      
      if (paymentOrder && paymentOrder.status !== 'completed') {
        // Fetch payment details to get payment method
        const razorpay = getRazorpayInstance();
        const payment = await razorpay.payments.fetch(paymentId);
        
        // Extract payment method information
        const paymentMethod = payment.method || 'unknown';
        const paymentMethodDetails: any = {
          method: paymentMethod,
        };

        // Add method-specific details
        if (paymentMethod === 'card' && payment.card) {
          paymentMethodDetails.card = {
            last4: payment.card.last4,
            network: payment.card.network,
            type: payment.card.type,
          };
        } else if (paymentMethod === 'upi' && payment.vpa) {
          paymentMethodDetails.vpa = payment.vpa;
        } else if (paymentMethod === 'wallet' && payment.wallet) {
          paymentMethodDetails.wallet = payment.wallet;
        } else if (paymentMethod === 'netbanking' && payment.bank) {
          paymentMethodDetails.bank = payment.bank;
        }
        
        // Update payment order status to completed
        await db
          .update(paymentOrders)
          .set({
            razorpayPaymentId: paymentId,
            status: 'completed',
            metadata: {
              ...(paymentOrder.metadata || {}),
              paymentMethod: paymentMethodDetails,
            },
            updatedAt: new Date(),
          })
          .where(eq(paymentOrders.id, paymentOrder.id));
      }
      return;
    }

    // Handle credit package payments (original logic)
    if (!orderId) return;

    // Find payment order
    const [paymentOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.razorpayOrderId, orderId))
      .limit(1);

    if (!paymentOrder || paymentOrder.type !== 'credit_package') return;

    // Fetch payment details to get payment method
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(paymentId);
    
    // Extract payment method information
    const paymentMethod = payment.method || 'unknown';
    const paymentMethodDetails: any = {
      method: paymentMethod,
    };

    // Add method-specific details
    if (paymentMethod === 'card' && payment.card) {
      paymentMethodDetails.card = {
        last4: payment.card.last4,
        network: payment.card.network,
        type: payment.card.type,
      };
    } else if (paymentMethod === 'upi' && payment.vpa) {
      paymentMethodDetails.vpa = payment.vpa;
    } else if (paymentMethod === 'wallet' && payment.wallet) {
      paymentMethodDetails.wallet = payment.wallet;
    } else if (paymentMethod === 'netbanking' && payment.bank) {
      paymentMethodDetails.bank = payment.bank;
    }

    // Update payment order status
    await db
      .update(paymentOrders)
      .set({
        razorpayPaymentId: paymentId,
        status: 'completed',
        metadata: {
          ...(paymentOrder.metadata || {}),
          paymentMethod: paymentMethodDetails,
        },
        updatedAt: new Date(),
      })
      .where(eq(paymentOrders.id, paymentOrder.id));

    // ✅ REMOVED: Credit addition - credits are added by verification (app), not webhooks
    // Webhooks only verify and update status, app handles credit addition

    // Generate invoice and receipt
    try {
      const invoiceResult = await InvoiceService.createInvoice(paymentOrder.id);
      if (invoiceResult.success) {
        logger.log('✅ RazorpayService: Invoice created in payment.captured webhook:', invoiceResult.data?.id);
        ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
          logger.error('❌ RazorpayService: Error generating receipt in webhook:', error);
        });
        // Send receipt email (async, don't block)
        ReceiptService.sendReceiptEmail(paymentOrder.id).catch((error) => {
          logger.error('❌ RazorpayService: Error sending receipt email in payment.captured webhook:', error);
        });
      } else {
        logger.error('❌ RazorpayService: Failed to create invoice in payment.captured webhook:', invoiceResult.error);
      }
    } catch (error) {
      logger.error('❌ RazorpayService: Error creating invoice/receipt in webhook:', error);
    }
  }

  private static async handlePaymentFailed(payload: any) {
    const orderId = payload.payment?.entity?.order_id;
    if (!orderId) return;

    // Update payment order status and get the updated order
    const updatedOrders = await db
      .update(paymentOrders)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(paymentOrders.razorpayOrderId, orderId))
      .returning();

    const paymentOrder = updatedOrders[0];
    if (!paymentOrder) {
      logger.warn('⚠️ RazorpayService: Payment order not found for failed payment:', orderId);
      return;
    }

    // Send subscription failed email if this is a subscription payment
    if (paymentOrder.type === 'subscription' && paymentOrder.razorpaySubscriptionId) {
      try {
        // Get subscription details
        const [subscription] = await db
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.razorpaySubscriptionId, paymentOrder.razorpaySubscriptionId))
          .limit(1);

        if (subscription) {
          // Get user details
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, subscription.userId))
            .limit(1);

          if (user?.email) {
            // Get plan details
            const [plan] = await db
              .select()
              .from(subscriptionPlans)
              .where(eq(subscriptionPlans.id, subscription.planId))
              .limit(1);

            const { sendSubscriptionFailedEmail } = await import('@/lib/services/email.service');
            await sendSubscriptionFailedEmail({
              name: user.name || 'User',
              email: user.email,
              planName: plan?.name || 'Subscription',
              amount: paymentOrder.amount,
              currency: paymentOrder.currency || 'INR',
              billingCycle: plan?.interval === 'year' ? 'yearly' : 'monthly',
              subscriptionId: subscription.id,
            });

            logger.log('✅ RazorpayService: Subscription failed email sent:', user.email);
          }
        }
      } catch (error) {
        logger.error('❌ RazorpayService: Failed to send subscription failed email:', error);
        // Don't fail payment failure handling if email fails
      }
    }
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

    // ✅ REMOVED: Credit addition - credits are added by verification (app), not webhooks
    // Webhooks only verify and update status, app handles credit addition

    // Get payment ID from webhook payload and fetch payment method
    const paymentId = payload.payment?.entity?.id;
    let paymentMethodDetails: any = null;
    
    if (paymentId) {
      try {
        const razorpay = getRazorpayInstance();
        const payment = await razorpay.payments.fetch(paymentId);
        
        const paymentMethod = payment.method || 'unknown';
        paymentMethodDetails = {
          method: paymentMethod,
        };

        // Add method-specific details
        if (paymentMethod === 'card' && payment.card) {
          paymentMethodDetails.card = {
            last4: payment.card.last4,
            network: payment.card.network,
            type: payment.card.type,
          };
        } else if (paymentMethod === 'upi' && payment.vpa) {
          paymentMethodDetails.vpa = payment.vpa;
        } else if (paymentMethod === 'wallet' && payment.wallet) {
          paymentMethodDetails.wallet = payment.wallet;
        } else if (paymentMethod === 'netbanking' && payment.bank) {
          paymentMethodDetails.bank = payment.bank;
        }
      } catch (error) {
        logger.error('❌ RazorpayService: Error fetching payment method in subscription activation webhook:', error);
      }
    }

    // Create or update payment order for this subscription
    let [paymentOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.razorpaySubscriptionId, subscriptionId))
      .orderBy(desc(paymentOrders.createdAt))
      .limit(1);

    if (!paymentOrder) {
      // Payment order doesn't exist, create it
      // Get plan details
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription.planId))
        .limit(1);
      
      if (plan) {
        [paymentOrder] = await db
          .insert(paymentOrders)
          .values({
            userId: subscription.userId,
            type: 'subscription',
            referenceId: subscription.planId,
            razorpaySubscriptionId: subscriptionId,
            razorpayPaymentId: paymentId || null,
            amount: plan.price.toString(),
            currency: plan.currency || 'INR',
            status: 'completed',
            metadata: {
              planName: plan.name,
              creditsPerMonth: plan.creditsPerMonth,
              paymentMethod: paymentMethodDetails,
            },
          })
          .returning();
        
        logger.log('✅ RazorpayService: Payment order created in subscription.activated webhook');
      }
    } else if (paymentMethodDetails) {
      // Update existing payment order with payment method
      await db
        .update(paymentOrders)
        .set({
          razorpayPaymentId: paymentId || paymentOrder.razorpayPaymentId,
          status: 'completed', // Ensure it's marked as completed
          metadata: {
            ...(paymentOrder.metadata || {}),
            paymentMethod: paymentMethodDetails,
          },
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, paymentOrder.id));
    }

    // Generate invoice and receipt
    if (paymentOrder && paymentOrder.status === 'completed') {
      try {
        const invoiceResult = await InvoiceService.createInvoice(paymentOrder.id);
        if (invoiceResult.success) {
          logger.log('✅ RazorpayService: Invoice created in subscription.activated webhook:', invoiceResult.data?.id);
          ReceiptService.generateReceiptPdf(paymentOrder.id).catch((error) => {
            logger.error('❌ RazorpayService: Error generating receipt in subscription activation webhook:', error);
          });
          // Send receipt email (async, don't block)
          ReceiptService.sendReceiptEmail(paymentOrder.id).catch((error) => {
            logger.error('❌ RazorpayService: Error sending receipt email in subscription activation webhook:', error);
          });
        } else {
          logger.error('❌ RazorpayService: Failed to create invoice in subscription.activated webhook:', invoiceResult.error);
        }
      } catch (error) {
        logger.error('❌ RazorpayService: Error creating invoice/receipt in subscription activation webhook:', error);
      }
    }

    // Send subscription activated email
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, subscription.userId))
        .limit(1);

      if (user?.email && plan) {
        const { sendSubscriptionActivatedEmail } = await import('@/lib/services/email.service');
        await sendSubscriptionActivatedEmail({
          name: user.name || 'User',
          email: user.email,
          planName: plan.name,
          amount: parseFloat(plan.price.toString()),
          currency: plan.currency || 'INR',
          billingCycle: plan.interval === 'year' ? 'yearly' : 'monthly',
          nextBillingDate: periodEnd,
          subscriptionId: subscription.id,
        });
      }
    } catch (error) {
      logger.error('❌ RazorpayService: Failed to send subscription activated email:', error);
      // Don't fail subscription activation if email fails
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

    // Get payment ID from webhook payload
    const paymentId = payload.payment?.entity?.id;
    
    // Fetch payment details to get payment method if payment ID is available
    let paymentMethodDetails: any = null;
    if (paymentId) {
      try {
        const razorpay = getRazorpayInstance();
        const payment = await razorpay.payments.fetch(paymentId);
        
        const paymentMethod = payment.method || 'unknown';
        paymentMethodDetails = {
          method: paymentMethod,
        };

        // Add method-specific details
        if (paymentMethod === 'card' && payment.card) {
          paymentMethodDetails.card = {
            last4: payment.card.last4,
            network: payment.card.network,
            type: payment.card.type,
          };
        } else if (paymentMethod === 'upi' && payment.vpa) {
          paymentMethodDetails.vpa = payment.vpa;
        } else if (paymentMethod === 'wallet' && payment.wallet) {
          paymentMethodDetails.wallet = payment.wallet;
        } else if (paymentMethod === 'netbanking' && payment.bank) {
          paymentMethodDetails.bank = payment.bank;
        }
      } catch (error) {
        logger.error('❌ RazorpayService: Error fetching payment method in subscription charged webhook:', error);
      }
    }

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
        // ✅ FIXED: Check for ambassador referral and calculate discount
        // First, try to get discount from subscription notes (stored at creation)
        let discountAmount = 0;
        let discountPercentage = 0;
        let originalAmount = parseFloat(plan.price.toString());
        
        // Try to get discount from Razorpay subscription notes if available
        try {
          const razorpay = getRazorpayInstance();
          const razorpaySubscription = await razorpay.subscriptions.fetch(subscriptionId);
          const notes = razorpaySubscription.notes || {};
          
          if (notes.ambassadorDiscount && notes.originalAmount) {
            discountAmount = parseFloat(notes.ambassadorDiscount);
            discountPercentage = parseFloat(notes.ambassadorDiscountPercentage || '0');
            originalAmount = parseFloat(notes.originalAmount);
            logger.log('💰 RazorpayService: Using discount from subscription notes:', {
              discountAmount,
              discountPercentage,
              originalAmount,
            });
          }
        } catch (error) {
          logger.warn('⚠️ RazorpayService: Could not fetch subscription notes, will calculate discount:', error);
        }
        
        // If discount not found in notes, calculate from referral data
        if (discountAmount === 0) {
          let referralData = null;
          try {
            const { AmbassadorDAL } = await import('@/lib/dal/ambassador');
            referralData = await AmbassadorDAL.getReferralByUserId(subscription.userId);
            
            if (referralData && referralData.ambassador.status === 'active') {
              discountPercentage = parseFloat(referralData.ambassador.discountPercentage.toString());
              discountAmount = (originalAmount * discountPercentage) / 100;
              logger.log('💰 RazorpayService: Calculated discount from referral data:', {
                discountAmount,
                discountPercentage,
                originalAmount,
              });
            }
          } catch (error) {
            logger.warn('⚠️ RazorpayService: Error checking ambassador referral:', error);
            // Continue without discount if ambassador check fails
          }
        }

        // Create payment order first
        const [newOrder] = await db.insert(paymentOrders).values({
          userId: subscription.userId,
          type: 'subscription',
          referenceId: subscription.planId,
          razorpaySubscriptionId: subscriptionId,
          razorpayPaymentId: paymentId || null,
          amount: (originalAmount - discountAmount).toString(), // Net amount after discount
          discountAmount: discountAmount.toString(),
          currency: plan.currency,
          status: 'completed',
          metadata: {
            planName: plan.name,
            creditsPerMonth: plan.creditsPerMonth,
            isRecurring: true,
            paymentMethod: paymentMethodDetails,
            originalAmount: originalAmount,
            discountAmount: discountAmount,
          },
        }).returning();
        recurringPaymentOrder = newOrder;

        // Process commission for ambassador after payment order is created
        if (referralData && referralData.ambassador.status === 'active' && discountAmount > 0) {
          try {
            const { AmbassadorService } = await import('@/lib/services/ambassador.service');
            await AmbassadorService.processSubscriptionPayment(
              subscription.userId,
              subscription.id,
              recurringPaymentOrder.id,
              originalAmount,
              discountAmount,
              subscription.currentPeriodStart,
              subscription.currentPeriodEnd,
              plan.currency || 'USD'
            );
          } catch (error) {
            logger.warn('⚠️ RazorpayService: Error processing ambassador commission:', error);
            // Don't fail payment processing if commission fails
          }
        }
      }
    } else if (paymentMethodDetails && existingPaymentOrder) {
      // Update existing payment order with payment method if we have it
      await db
        .update(paymentOrders)
        .set({
          razorpayPaymentId: paymentId || existingPaymentOrder.razorpayPaymentId,
          metadata: {
            ...(existingPaymentOrder.metadata || {}),
            paymentMethod: paymentMethodDetails,
          },
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, existingPaymentOrder.id));
    }

    // ✅ REMOVED: Credit addition - credits are added by verification (app), not webhooks
    // Webhooks only verify and update status, app handles credit addition
    // For recurring payments, the app will verify and add credits when user checks subscription status

    // Generate invoice and receipt for recurring charge
    if (recurringPaymentOrder && recurringPaymentOrder.status === 'completed') {
      try {
        const invoiceResult = await InvoiceService.createInvoice(recurringPaymentOrder.id);
        if (invoiceResult.success) {
          logger.log('✅ RazorpayService: Invoice created in subscription.charged webhook:', invoiceResult.data?.id);
          ReceiptService.generateReceiptPdf(recurringPaymentOrder.id).catch((error) => {
            logger.error('❌ RazorpayService: Error generating receipt in subscription charge webhook:', error);
          });
          // Send receipt email (async, don't block)
          ReceiptService.sendReceiptEmail(recurringPaymentOrder.id).catch((error) => {
            logger.error('❌ RazorpayService: Error sending receipt email in subscription charge webhook:', error);
          });
        } else {
          logger.error('❌ RazorpayService: Failed to create invoice in subscription.charged webhook:', invoiceResult.error);
        }
      } catch (error) {
        logger.error('❌ RazorpayService: Error creating invoice/receipt in subscription charge webhook:', error);
      }
    }

    // Send subscription renewed email
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, subscription.userId))
        .limit(1);

      if (user?.email && plan && recurringPaymentOrder) {
        const { sendSubscriptionRenewedEmail } = await import('@/lib/services/email.service');
        // Get app URL - use production URL in production
        const isProduction = process.env.NODE_ENV === 'production';
        const appUrl = isProduction 
          ? (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://renderiq.io')
          : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
        const invoiceUrl = recurringPaymentOrder.invoiceNumber
          ? `${appUrl}/api/payments/invoice/${recurringPaymentOrder.invoiceNumber}`
          : undefined;

        await sendSubscriptionRenewedEmail({
          name: user.name || 'User',
          email: user.email,
          planName: plan.name,
          amount: parseFloat(recurringPaymentOrder.amount.toString()),
          currency: recurringPaymentOrder.currency || 'INR',
          billingCycle: plan.interval === 'year' ? 'yearly' : 'monthly',
          nextBillingDate: periodEnd,
          invoiceUrl: invoiceUrl,
        });
      }
    } catch (error) {
      logger.error('❌ RazorpayService: Failed to send subscription renewed email:', error);
      // Don't fail subscription renewal if email fails
    }
  }

  private static async handleSubscriptionCancelled(payload: any) {
    const subscriptionId = payload.subscription?.entity?.id;
    if (!subscriptionId) return;

    // Find subscription to get user and plan details
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId))
      .limit(1);

    if (!subscription) {
      logger.warn('⚠️ RazorpayService: Subscription not found for cancellation:', subscriptionId);
      return;
    }

    await db
      .update(userSubscriptions)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.razorpaySubscriptionId, subscriptionId));

    // Send subscription cancelled email
    try {
      const [user, plan] = await Promise.all([
        db.select().from(users).where(eq(users.id, subscription.userId)).limit(1),
        db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, subscription.planId)).limit(1),
      ]);

      if (user[0]?.email && plan[0]) {
        const { sendSubscriptionCancelledEmail } = await import('@/lib/services/email.service');
        await sendSubscriptionCancelledEmail({
          name: user[0].name || 'User',
          email: user[0].email,
          planName: plan[0].name,
          amount: parseFloat(plan[0].price.toString()),
          currency: plan[0].currency || 'INR',
          billingCycle: plan[0].interval === 'year' ? 'yearly' : 'monthly',
        });
      }
    } catch (error) {
      logger.error('❌ RazorpayService: Failed to send subscription cancelled email:', error);
      // Don't fail cancellation if email fails
    }
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

