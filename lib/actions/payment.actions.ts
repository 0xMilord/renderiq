'use server';

import { getCachedUser } from '@/lib/services/auth-cache';
import { PaymentHistoryService } from '@/lib/services/payment-history.service';
import { InvoiceService } from '@/lib/services/invoice.service';
import { ReceiptService } from '@/lib/services/receipt.service';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { BillingDAL } from '@/lib/dal/billing';
import { db } from '@/lib/db';
import { paymentOrders, creditPackages, subscriptionPlans, userSubscriptions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/payment-security';
import { convertCurrency, getRazorpayCurrencyCode, SUPPORTED_CURRENCIES } from '@/lib/utils/currency';

export async function getPaymentHistoryAction(filters?: {
  type?: 'subscription' | 'credit_package';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await PaymentHistoryService.getPaymentHistory({
      userId: user.id,
      ...filters,
    });

    return result;
  } catch (error) {
    logger.error('❌ PaymentActions: Error getting payment history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment history',
    };
  }
}

export async function getInvoicesAction(options?: {
  limit?: number;
  offset?: number;
  status?: string;
}) {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await InvoiceService.getUserInvoices(user.id, options);

    return result;
  } catch (error) {
    logger.error('❌ PaymentActions: Error getting invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invoices',
    };
  }
}

export async function getInvoiceByNumberAction(invoiceNumber: string) {
  try {
    const { user } = await getCachedUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const result = await InvoiceService.getInvoiceByNumber(invoiceNumber);

    if (!result.success) {
      return result;
    }

    // Check authorization
    if (result.data?.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return result;
  } catch (error) {
    logger.error('❌ PaymentActions: Error getting invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invoice',
    };
  }
}

/**
 * Create Razorpay order for credit package purchase
 */
export async function createPaymentOrderAction(
  creditPackageId: string,
  currency?: string
) {
  try {
    logger.log('💳 PaymentActions: Creating payment order');

    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Rate limiting
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return { success: false, error: 'Too many requests. Please try again later.' };
    }

    // Validate currency
    const finalCurrency = currency && SUPPORTED_CURRENCIES[currency]
      ? getRazorpayCurrencyCode(currency)
      : 'INR';

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

    // Convert price if currency is different
    let orderAmount = parseFloat(packageData.price);
    if (finalCurrency !== 'INR' && packageData.currency === 'INR') {
      // Convert from INR to target currency
      orderAmount = await convertCurrency(orderAmount, finalCurrency);
      
      // Ensure minimum amount after conversion
      const minimumAmounts: Record<string, number> = {
        INR: 1.00, USD: 0.01, EUR: 0.01, GBP: 0.01, JPY: 1,
        AUD: 0.01, CAD: 0.01, SGD: 0.01, AED: 0.01, SAR: 0.01,
      };
      const minimumAmount = minimumAmounts[finalCurrency] || 0.01;
      
      if (orderAmount < minimumAmount) {
        logger.log(`⚠️ PaymentActions: Converted amount ${orderAmount} ${finalCurrency} is below minimum ${minimumAmount}, using INR instead`);
        // Revert to INR if converted amount is too small
        orderAmount = parseFloat(packageData.price);
      }
    }

    // Create Razorpay order
    const result = await RazorpayService.createOrder(
      user.id,
      creditPackageId,
      orderAmount,
      finalCurrency
    );

    if (!result.success) {
      return result;
    }

    logger.log('✅ PaymentActions: Order created successfully:', result.data?.orderId);
    return result;
  } catch (error) {
    logger.error('❌ PaymentActions: Error creating payment order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}

/**
 * Create Razorpay subscription
 */
export async function createPaymentSubscriptionAction(
  planId: string,
  upgrade: boolean = false,
  currency?: string
) {
  try {
    logger.log('💳 PaymentActions: Creating payment subscription');

    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!user.email) {
      return { success: false, error: 'User email not found' };
    }

    // Validate currency if provided
    const finalCurrency = currency && SUPPORTED_CURRENCIES[currency]
      ? getRazorpayCurrencyCode(currency)
      : 'INR'; // Default to INR (plan currency)

    logger.log('📥 PaymentActions: Received subscription request:', {
      planId,
      upgrade,
      userId: user.id,
      requestedCurrency: currency,
      finalCurrency,
    });

    // Check for existing subscription
    const existingSubscription = await BillingDAL.getUserSubscription(user.id);
    
    if (existingSubscription) {
      const isActive = existingSubscription.subscription.status === 'active';
      const isDifferentPlan = existingSubscription.subscription.planId !== planId;
      
      logger.log('🔍 PaymentActions: Existing subscription check:', {
        isActive,
        isDifferentPlan,
        existingPlanId: existingSubscription.subscription.planId,
        newPlanId: planId,
        upgrade,
      });
      
      // If user already has active subscription and selecting same plan, block it
      if (isActive && !isDifferentPlan && !upgrade) {
        logger.warn('⚠️ PaymentActions: User trying to subscribe to same plan:', {
          userId: user.id,
          planId,
        });
        
        return {
          success: false,
          error: 'You are already subscribed to this plan.',
          hasExistingSubscription: true,
          existingSubscription: {
            planId: existingSubscription.subscription.planId,
            planName: existingSubscription.plan?.name,
            status: existingSubscription.subscription.status,
          },
        };
      }
      
      // If user has active subscription and selecting different plan, treat as upgrade/downgrade
      const shouldUpgrade = upgrade || (isActive && isDifferentPlan);
      
      // If upgrading/downgrading, cancel old subscription first
      if (shouldUpgrade && isActive) {
        logger.log('🔄 PaymentActions: Upgrading/downgrading subscription - cancelling old one');
        
        // Cancel old subscription in Razorpay
        if (existingSubscription.subscription.razorpaySubscriptionId) {
          try {
            const Razorpay = require('razorpay');
            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            
            if (keyId && keySecret) {
              const razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
              });
              
              // Cancel the old subscription in Razorpay
              await razorpay.subscriptions.cancel(existingSubscription.subscription.razorpaySubscriptionId);
              logger.log('✅ PaymentActions: Old subscription cancelled in Razorpay');
            }
          } catch (error: any) {
            logger.warn('⚠️ PaymentActions: Could not cancel old subscription in Razorpay (may already be cancelled):', error.message);
            // Continue with upgrade even if cancellation fails
          }
        }
        
        // Mark old subscription as canceled in database
        await db
          .update(userSubscriptions)
          .set({
            status: 'canceled',
            cancelAtPeriodEnd: false,
            canceledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.id, existingSubscription.subscription.id));
        
        logger.log('✅ PaymentActions: Old subscription marked as canceled in database');
      }
    }

    // Get plan details for currency conversion
    const [planData] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!planData) {
      return { success: false, error: 'Subscription plan not found' };
    }

    // Convert price if currency is different from plan currency
    let convertedAmount = parseFloat(planData.price);
    let displayCurrency = planData.currency;
    
    if (finalCurrency !== 'INR' && planData.currency === 'INR') {
      // Convert from INR to target currency for display/reference
      convertedAmount = await convertCurrency(parseFloat(planData.price), finalCurrency);
      displayCurrency = finalCurrency;
      
      logger.log(`💱 PaymentActions: Converted subscription price: ${planData.price} ${planData.currency} → ${convertedAmount.toFixed(2)} ${finalCurrency}`);
      
      // Note: Razorpay subscriptions use the plan's currency (INR), but we store converted amount for reference
    }

    // Create subscription
    // Note: Razorpay subscriptions use the plan's pre-configured currency (INR)
    // The converted amount is stored in metadata for reference
    const result = await RazorpayService.createSubscription(
      user.id,
      planId,
      {
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email,
      },
      {
        requestedCurrency: finalCurrency,
        convertedAmount: finalCurrency !== planData.currency ? convertedAmount : undefined,
        originalAmount: parseFloat(planData.price),
        originalCurrency: planData.currency,
      }
    );

    if (!result.success) {
      // Provide more detailed error response
      const errorMessage = result.error || 'Failed to create subscription';
      
      // Check if it's the subscriptions not enabled error
      const isSubscriptionsNotEnabled = errorMessage.includes('Subscriptions Feature Not Enabled') || 
                                        errorMessage.includes('not enabled');
      
      return {
        success: false,
        error: errorMessage,
        requiresRazorpaySupport: isSubscriptionsNotEnabled,
        errorType: isSubscriptionsNotEnabled ? 'SUBSCRIPTIONS_NOT_ENABLED' : 'OTHER'
      };
    }

    logger.log('✅ PaymentActions: Subscription created successfully:', result.data?.subscriptionId);
    return result;
  } catch (error) {
    logger.error('❌ PaymentActions: Error creating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription',
    };
  }
}

/**
 * Get payment order by ID with reference details
 */
export async function getPaymentOrderAction(id: string) {
  try {
    logger.log('📊 PaymentActions: Getting payment order:', id);

    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Fetch payment with reference details using LEFT JOIN (single query)
    const [paymentWithDetails] = await db
      .select({
        payment: paymentOrders,
        package: creditPackages,
        plan: subscriptionPlans,
      })
      .from(paymentOrders)
      .leftJoin(
        creditPackages,
        and(
          eq(paymentOrders.referenceId, creditPackages.id),
          eq(paymentOrders.type, 'credit_package')
        )
      )
      .leftJoin(
        subscriptionPlans,
        and(
          eq(paymentOrders.referenceId, subscriptionPlans.id),
          eq(paymentOrders.type, 'subscription')
        )
      )
      .where(
        and(
          eq(paymentOrders.id, id),
          eq(paymentOrders.userId, user.id) // Ensure user owns this payment
        )
      )
      .limit(1);

    if (!paymentWithDetails) {
      return { success: false, error: 'Payment order not found' };
    }

    // Format response with reference details
    const referenceDetails = paymentWithDetails.payment.type === 'credit_package' 
      ? paymentWithDetails.package 
      : paymentWithDetails.payment.type === 'subscription'
      ? paymentWithDetails.plan
      : null;

    const payment = {
      ...paymentWithDetails.payment,
      referenceDetails,
    };

    return { success: true, data: payment };
  } catch (error) {
    logger.error('❌ PaymentActions: Error getting payment order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment order',
    };
  }
}

/**
 * Get payment order by Razorpay subscription ID
 */
export async function getPaymentOrderBySubscriptionAction(subscriptionId: string) {
  try {
    logger.log('📊 PaymentActions: Getting payment order by subscription ID:', subscriptionId);

    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Fetch payment with reference details using LEFT JOIN (single query)
    const [paymentWithDetails] = await db
      .select({
        payment: paymentOrders,
        package: creditPackages,
        plan: subscriptionPlans,
      })
      .from(paymentOrders)
      .leftJoin(
        creditPackages,
        and(
          eq(paymentOrders.referenceId, creditPackages.id),
          eq(paymentOrders.type, 'credit_package')
        )
      )
      .leftJoin(
        subscriptionPlans,
        and(
          eq(paymentOrders.referenceId, subscriptionPlans.id),
          eq(paymentOrders.type, 'subscription')
        )
      )
      .where(
        and(
          eq(paymentOrders.razorpaySubscriptionId, subscriptionId),
          eq(paymentOrders.userId, user.id) // Ensure user owns this payment
        )
      )
      .orderBy(desc(paymentOrders.createdAt))
      .limit(1);

    if (!paymentWithDetails) {
      return { success: false, error: 'Payment order not found' };
    }

    // Format response with reference details
    const referenceDetails = paymentWithDetails.payment.type === 'credit_package' 
      ? paymentWithDetails.package 
      : paymentWithDetails.payment.type === 'subscription'
      ? paymentWithDetails.plan
      : null;

    const payment = {
      ...paymentWithDetails.payment,
      referenceDetails,
    };

    return { success: true, data: payment };
  } catch (error) {
    logger.error('❌ PaymentActions: Error getting payment order by subscription ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payment order',
    };
  }
}

/**
 * Get receipt URL or generate receipt PDF
 * Note: For PDF downloads, we still use the API route for streaming
 */
export async function getReceiptAction(id: string) {
  try {
    logger.log('🧾 PaymentActions: Getting receipt for payment order:', id);

    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if id is a UUID (payment order ID) or Razorpay subscription ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let paymentOrder;
    let paymentOrderId: string;
    
    if (isUUID) {
      // It's a payment order ID
      const [order] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, id))
        .limit(1);
      paymentOrder = order;
      paymentOrderId = id;
    } else if (id.startsWith('sub_')) {
      // It's a Razorpay subscription ID - find the most recent payment order for this subscription
      const [order] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.razorpaySubscriptionId, id))
        .orderBy(desc(paymentOrders.createdAt))
        .limit(1);
      paymentOrder = order;
      paymentOrderId = order?.id || '';
    } else {
      return { success: false, error: 'Invalid payment order or subscription ID' };
    }

    if (!paymentOrder) {
      return { success: false, error: 'Payment order not found' };
    }

    // Check authorization
    if (paymentOrder.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate receipt if not already generated
    if (!paymentOrder.receiptPdfUrl) {
      const receiptResult = await ReceiptService.generateReceiptPdf(paymentOrderId);
      if (!receiptResult.success) {
        return { success: false, error: receiptResult.error };
      }
    }

    // Get updated payment order with receipt URL
    const [updatedOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, paymentOrderId))
      .limit(1);

    if (!updatedOrder?.receiptPdfUrl) {
      return { success: false, error: 'Failed to generate receipt' };
    }

    // Return receipt URL (for downloads, use API route)
    return {
      success: true,
      data: {
        receiptUrl: updatedOrder.receiptPdfUrl,
        invoiceNumber: updatedOrder.invoiceNumber,
      },
    };
  } catch (error) {
    logger.error('❌ PaymentActions: Error getting receipt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}

/**
 * Generate receipt PDF
 */
export async function generateReceiptAction(id: string) {
  try {
    logger.log('🧾 PaymentActions: Generating receipt for payment order:', id);

    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if id is a UUID (payment order ID) or Razorpay subscription ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let paymentOrder;
    let paymentOrderId: string;
    
    if (isUUID) {
      const [order] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, id))
        .limit(1);
      paymentOrder = order;
      paymentOrderId = id;
    } else if (id.startsWith('sub_')) {
      const [order] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.razorpaySubscriptionId, id))
        .orderBy(desc(paymentOrders.createdAt))
        .limit(1);
      paymentOrder = order;
      paymentOrderId = order?.id || '';
    } else {
      return { success: false, error: 'Invalid payment order or subscription ID' };
    }

    if (!paymentOrder) {
      return { success: false, error: 'Payment order not found' };
    }

    // Check authorization
    if (paymentOrder.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate receipt
    const receiptResult = await ReceiptService.generateReceiptPdf(paymentOrderId);

    if (!receiptResult.success) {
      return { success: false, error: receiptResult.error };
    }

    return {
      success: true,
      data: {
        receiptUrl: receiptResult.pdfUrl,
      },
    };
  } catch (error) {
    logger.error('❌ PaymentActions: Error generating receipt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}

/**
 * Cancel payment order (only if pending)
 */
export async function cancelPaymentOrderAction(orderId?: string, paymentOrderId?: string) {
  try {
    logger.log('🚫 PaymentActions: Cancelling payment order');

    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!orderId && !paymentOrderId) {
      return { success: false, error: 'Order ID or Payment Order ID is required' };
    }

    // Find the payment order
    let paymentOrder;
    if (paymentOrderId) {
      [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.id, paymentOrderId))
        .limit(1);
    } else if (orderId) {
      [paymentOrder] = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.razorpayOrderId, orderId))
        .limit(1);
    }

    if (!paymentOrder) {
      return { success: false, error: 'Payment order not found' };
    }

    // Verify the order belongs to the user
    if (paymentOrder.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Only cancel if status is pending (not already completed/failed/cancelled)
    if (paymentOrder.status === 'pending') {
      // Update database status to cancelled
      await db
        .update(paymentOrders)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(paymentOrders.id, paymentOrder.id));

      logger.log('✅ PaymentActions: Payment order cancelled successfully');
      return { success: true };
    } else {
      logger.log('⚠️ PaymentActions: Payment order is not pending, cannot cancel:', paymentOrder.status);
      return {
        success: false,
        error: `Payment order is ${paymentOrder.status}, cannot cancel`,
      };
    }
  } catch (error) {
    logger.error('❌ PaymentActions: Error cancelling payment order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}

/**
 * Cancel pending subscription
 */
export async function cancelPaymentSubscriptionAction(subscriptionId: string) {
  try {
    logger.log('🚫 PaymentActions: Cancelling subscription');

    const { user } = await getCachedUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    if (!subscriptionId) {
      return { success: false, error: 'Subscription ID is required' };
    }

    // Cancel the subscription
    const result = await RazorpayService.cancelPendingSubscription(subscriptionId);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to cancel subscription' };
    }

    logger.log('✅ PaymentActions: Subscription cancelled successfully');
    return { success: true };
  } catch (error) {
    logger.error('❌ PaymentActions: Error cancelling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}


