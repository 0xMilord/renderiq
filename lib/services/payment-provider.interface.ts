/**
 * Payment Provider Interface
 * 
 * Unified interface for all payment providers (Razorpay, Paddle, LemonSqueezy)
 * Allows seamless switching between providers based on user location
 */

export type PaymentProviderType = 'razorpay' | 'paddle' | 'lemonsqueezy';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'pending';

export interface OrderResult {
  success: boolean;
  data?: {
    orderId: string;
    amount: number;
    currency: string;
    creditPackageId?: string;
    credits?: number;
    bonusCredits?: number;
    packageName?: string;
    checkoutUrl?: string; // For Paddle/LemonSqueezy hosted checkout
    clientToken?: string; // For client-side SDK initialization
  };
  error?: string;
}

export interface PaymentVerificationData {
  orderId: string;
  paymentId: string;
  signature?: string; // For Razorpay
  transactionId?: string; // For Paddle/LemonSqueezy
}

export interface VerificationResult {
  success: boolean;
  data?: {
    paymentOrderId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    transactionId: string;
  };
  error?: string;
}

export interface SubscriptionResult {
  success: boolean;
  data?: {
    subscriptionId: string;
    customerId: string;
    checkoutUrl?: string;
    clientToken?: string;
  };
  error?: string;
}

export interface CancelResult {
  success: boolean;
  error?: string;
}

export interface WebhookEvent {
  event: string;
  payload: any;
}

/**
 * Payment Provider Interface
 * 
 * All payment providers must implement this interface
 */
export interface PaymentProvider {
  /**
   * Get the provider type
   */
  getProviderType(): PaymentProviderType;

  /**
   * Create a payment order for one-time purchase (credit package)
   */
  createOrder(
    userId: string,
    creditPackageId: string,
    amount: number,
    currency: string
  ): Promise<OrderResult>;

  /**
   * Verify a payment after completion
   */
  verifyPayment(paymentData: PaymentVerificationData): Promise<VerificationResult>;

  /**
   * Create a subscription
   */
  createSubscription(
    userId: string,
    planId: string,
    currency: string
  ): Promise<SubscriptionResult>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string): Promise<CancelResult>;

  /**
   * Verify webhook signature
   */
  verifyWebhook(body: string, signature: string): boolean;

  /**
   * Handle webhook event
   */
  handleWebhook(event: string, payload: any): Promise<{ success: boolean; error?: string }>;
}

