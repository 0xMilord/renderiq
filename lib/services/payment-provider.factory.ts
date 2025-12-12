/**
 * Payment Provider Factory
 * 
 * Routes payment requests to the appropriate provider based on user location
 * - India (IN) → Razorpay
 * - International → Paddle
 */

import { RazorpayService } from './razorpay.service';
import { PaddleService } from './paddle.service';
import type { PaymentProvider, PaymentProviderType } from './payment-provider.interface';
import { detectUserCountry, getPaymentProviderForCountry } from '@/lib/utils/country-detection';
import { logger } from '@/lib/utils/logger';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export class PaymentProviderFactory {
  /**
   * Get payment provider for a country code
   */
  static getProvider(country: string): PaymentProvider {
    const providerType = getPaymentProviderForCountry(country);
    
    if (providerType === 'razorpay') {
      return new RazorpayServiceAdapter();
    }
    
    return new PaddleService();
  }

  /**
   * Get payment provider for a user (detects country automatically)
   */
  static async getProviderForUser(userId: string, request?: Request): Promise<PaymentProvider> {
    try {
      // Detect country from request
      const country = await detectUserCountry(request);
      
      logger.log('🌍 PaymentProviderFactory: Detected country for user:', { userId, country });
      
      return this.getProvider(country);
    } catch (error) {
      logger.error('❌ PaymentProviderFactory: Error getting provider for user:', error);
      // Default to Paddle (international) on error
      return new PaddleService();
    }
  }

  /**
   * Get payment provider by type (for explicit provider selection)
   */
  static getProviderByType(providerType: PaymentProviderType): PaymentProvider {
    switch (providerType) {
      case 'razorpay':
        return new RazorpayServiceAdapter();
      case 'paddle':
        return new PaddleService();
      default:
        throw new Error(`Unknown payment provider type: ${providerType}`);
    }
  }
}

/**
 * Razorpay Service Adapter
 * 
 * Adapts RazorpayService static methods to PaymentProvider interface
 */
class RazorpayServiceAdapter implements PaymentProvider {
  getProviderType(): PaymentProviderType {
    return 'razorpay';
  }

  async createOrder(
    userId: string,
    creditPackageId: string,
    amount: number,
    currency: string
  ) {
    return RazorpayService.createOrder(userId, creditPackageId, amount, currency);
  }

  async verifyPayment(paymentData: any) {
    if (!paymentData.razorpayOrderId || !paymentData.razorpayPaymentId || !paymentData.razorpaySignature) {
      return {
        success: false,
        error: 'Missing Razorpay payment verification data',
      };
    }

    return RazorpayService.verifyPayment(
      paymentData.razorpayOrderId,
      paymentData.razorpayPaymentId,
      paymentData.razorpaySignature
    );
  }

  async createSubscription(userId: string, planId: string, currency: string) {
    // Get user details for Razorpay
    const { db } = await import('@/lib/db');
    const { users } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.email) {
      return { success: false, error: 'User not found or email missing' };
    }

    return RazorpayService.createSubscription(
      userId,
      planId,
      {
        name: user.name || user.email,
        email: user.email,
      },
      {
        requestedCurrency: currency,
      }
    );
  }

  async cancelSubscription(subscriptionId: string) {
    return RazorpayService.cancelSubscription(subscriptionId);
  }

  verifyWebhook(body: string, signature: string): boolean {
    return RazorpayService.verifyWebhookSignature(body, signature);
  }

  async handleWebhook(event: string, payload: any) {
    return RazorpayService.handleWebhook(event, payload);
  }
}

