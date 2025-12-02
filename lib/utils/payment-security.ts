import { db } from '@/lib/db';
import { paymentOrders } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { logger } from './logger';

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

/**
 * Check if user has exceeded rate limit
 */
export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = `payment:${userId}`;
  const cached = rateLimitCache.get(key);

  if (!cached || now > cached.resetAt) {
    // Reset or create new window
    rateLimitCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (cached.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  cached.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - cached.count };
}

/**
 * Validate payment amount matches expected amount
 */
export async function validatePaymentAmount(
  paymentOrderId: string,
  expectedAmount: number,
  tolerance: number = 0.01
): Promise<{ valid: boolean; error?: string }> {
  try {
    const [paymentOrder] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.id, paymentOrderId))
      .limit(1);

    if (!paymentOrder) {
      return { valid: false, error: 'Payment order not found' };
    }

    const actualAmount = parseFloat(paymentOrder.amount || '0');
    const difference = Math.abs(actualAmount - expectedAmount);

    if (difference > tolerance) {
      logger.error('❌ PaymentSecurity: Amount mismatch:', {
        expected: expectedAmount,
        actual: actualAmount,
        difference,
      });
      return {
        valid: false,
        error: `Payment amount mismatch. Expected ${expectedAmount}, got ${actualAmount}`,
      };
    }

    return { valid: true };
  } catch (error) {
    logger.error('❌ PaymentSecurity: Error validating payment amount:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate payment amount',
    };
  }
}

/**
 * Check for duplicate payment attempts
 */
export async function checkDuplicatePayment(
  razorpayOrderId: string,
  razorpayPaymentId: string
): Promise<{ isDuplicate: boolean; existingOrderId?: string }> {
  try {
    // Check if payment ID already exists
    const [existingByPaymentId] = await db
      .select()
      .from(paymentOrders)
      .where(eq(paymentOrders.razorpayPaymentId, razorpayPaymentId))
      .limit(1);

    if (existingByPaymentId) {
      return {
        isDuplicate: true,
        existingOrderId: existingByPaymentId.id,
      };
    }

    // Check for recent duplicate order attempts (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [recentOrder] = await db
      .select()
      .from(paymentOrders)
      .where(
        and(
          eq(paymentOrders.razorpayOrderId, razorpayOrderId),
          gte(paymentOrders.createdAt, fiveMinutesAgo)
        )
      )
      .limit(1);

    if (recentOrder && recentOrder.status === 'completed') {
      return {
        isDuplicate: true,
        existingOrderId: recentOrder.id,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    logger.error('❌ PaymentSecurity: Error checking duplicate payment:', error);
    // On error, allow the payment (fail open for availability)
    return { isDuplicate: false };
  }
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitCache() {
  const now = Date.now();
  for (const [key, value] of rateLimitCache.entries()) {
    if (now > value.resetAt) {
      rateLimitCache.delete(key);
    }
  }
}

// Clean up cache every 5 minutes
setInterval(cleanupRateLimitCache, 5 * 60 * 1000);

