'use server';

import { getCachedUser } from '@/lib/services/auth-cache';
import { PaymentHistoryService } from '@/lib/services/payment-history.service';
import { InvoiceService } from '@/lib/services/invoice.service';
import { ReceiptService } from '@/lib/services/receipt.service';
import { RazorpayService } from '@/lib/services/razorpay.service';
import { PaymentProviderFactory } from '@/lib/services/payment-provider.factory';
import { BillingDAL } from '@/lib/dal/billing';
import { db } from '@/lib/db';
import { paymentOrders, creditPackages, subscriptionPlans, userSubscriptions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/payment-security';
import { convertCurrency } from '@/lib/utils/currency';
import { detectUserCountry } from '@/lib/utils/country-detection';
import { headers } from 'next/headers';

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
 * Create payment order for credit package purchase
 * Automatically routes to Razorpay (India) or Paddle (International)
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

    // Detect user country and get appropriate payment provider
    // Pass currency to factory - if INR, it will use Razorpay regardless of country
    const country = await detectUserCountry(undefined, user.id);
    const provider = await PaymentProviderFactory.getProviderForUser(user.id, undefined, currency);
    
    logger.log('🌍 PaymentActions: Using payment provider based on country and currency:', { 
      country, 
      currency,
      providerType: provider.getProviderType() 
    });

    // Simple currency logic: India → INR, Not India → USD
    const isRazorpay = provider.getProviderType() === 'razorpay';
    const finalCurrency = isRazorpay ? 'INR' : 'USD';

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

    // Convert price: INR base prices → USD for international users
    let orderAmount = parseFloat(packageData.price);
    if (!isRazorpay && packageData.currency === 'INR') {
      // Convert INR to USD: 1 INR = 0.012 USD (83 INR = 1 USD)
      orderAmount = await convertCurrency(orderAmount, 'USD');
    }

    // Create order using appropriate provider
    const result = await provider.createOrder(
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

    // Detect user country and get appropriate payment provider
    // Pass currency to factory - if INR, it will use Razorpay regardless of country
    const country = await detectUserCountry(undefined, user.id);
    const provider = await PaymentProviderFactory.getProviderForUser(user.id, undefined, currency);
    const isRazorpay = provider.getProviderType() === 'razorpay';

    // Simple currency logic: India → INR, Not India → USD
    // If currency is provided, use it; otherwise determine from provider
    const finalCurrency = currency || (isRazorpay ? 'INR' : 'USD');

    logger.log('📥 PaymentActions: Received subscription request:', {
      planId,
      upgrade,
      userId: user.id,
      requestedCurrency: currency,
      finalCurrency,
      country,
      providerType: provider.getProviderType(),
    });

    // Check for existing subscription
    const existingSubscription = await BillingDAL.getUserSubscription(user.id);
    
    if (existingSubscription) {
      // ✅ FIXED: Check if subscription is valid (not just active) - handles canceled subscriptions with valid period
      const status = existingSubscription.subscription.status;
      const currentPeriodEnd = existingSubscription.subscription.currentPeriodEnd ? new Date(existingSubscription.subscription.currentPeriodEnd) : null;
      const now = new Date();
      const isValidStatus = status !== 'unpaid';
      const isPeriodValid = currentPeriodEnd ? currentPeriodEnd > now : false;
      const isActive = isValidStatus && isPeriodValid; // Valid subscription (not just status='active')
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
        
        // Get the provider for the existing subscription
        const existingProviderType = existingSubscription.subscription.paymentProvider || 'razorpay';
        const existingProvider = PaymentProviderFactory.getProviderByType(existingProviderType as any);
        
        // Cancel old subscription using appropriate provider
        const subscriptionId = existingSubscription.subscription.razorpaySubscriptionId || 
                              existingSubscription.subscription.paddleSubscriptionId ||
                              existingSubscription.subscription.lemonsqueezySubscriptionId;
        
        if (subscriptionId) {
          try {
            await existingProvider.cancelSubscription(subscriptionId);
            logger.log(`✅ PaymentActions: Old subscription cancelled in ${existingProviderType}`);
          } catch (error: any) {
            logger.warn(`⚠️ PaymentActions: Could not cancel old subscription in ${existingProviderType} (may already be cancelled):`, error.message);
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

    // Convert price: INR base prices → USD for international users
    // Note: This is for display/reference only, actual payment uses provider's currency

    // Create subscription using appropriate provider
    const result = await provider.createSubscription(
      user.id,
      planId,
      finalCurrency
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


