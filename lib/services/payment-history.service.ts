import { db } from '@/lib/db';
import { paymentOrders, users, creditPackages, subscriptionPlans } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

export interface PaymentHistoryFilters {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  type?: 'subscription' | 'credit_package';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  limit?: number;
  offset?: number;
}

export class PaymentHistoryService {
  /**
   * Get payment history for a user with filters
   */
  static async getPaymentHistory(filters: PaymentHistoryFilters): Promise<{
    success: boolean;
    data?: {
      payments: any[];
      total: number;
      limit: number;
      offset: number;
    };
    error?: string;
  }> {
    try {
      logger.log('📊 PaymentHistoryService: Getting payment history:', filters);

      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      // Build query conditions
      const conditions: any[] = [eq(paymentOrders.userId, filters.userId)];

      if (filters.startDate) {
        conditions.push(gte(paymentOrders.createdAt, filters.startDate));
      }

      if (filters.endDate) {
        conditions.push(lte(paymentOrders.createdAt, filters.endDate));
      }

      if (filters.type) {
        conditions.push(eq(paymentOrders.type, filters.type));
      }

      if (filters.status) {
        conditions.push(eq(paymentOrders.status, filters.status));
      }

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(paymentOrders)
        .where(and(...conditions));

      const total = Number(totalResult[0]?.count || 0);

      // Get payments
      const payments = await db
        .select()
        .from(paymentOrders)
        .where(and(...conditions))
        .orderBy(desc(paymentOrders.createdAt))
        .limit(limit)
        .offset(offset);

      // Enrich payments with reference details
      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          let referenceDetails: any = null;

          if (payment.type === 'credit_package' && payment.referenceId) {
            const [packageData] = await db
              .select()
              .from(creditPackages)
              .where(eq(creditPackages.id, payment.referenceId))
              .limit(1);
            referenceDetails = packageData;
          } else if (payment.type === 'subscription' && payment.referenceId) {
            const [plan] = await db
              .select()
              .from(subscriptionPlans)
              .where(eq(subscriptionPlans.id, payment.referenceId))
              .limit(1);
            referenceDetails = plan;
          }

          return {
            ...payment,
            referenceDetails,
          };
        })
      );

      return {
        success: true,
        data: {
          payments: enrichedPayments,
          total,
          limit,
          offset,
        },
      };
    } catch (error) {
      logger.error('❌ PaymentHistoryService: Error getting payment history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment history',
      };
    }
  }

  /**
   * Get payment statistics for a user
   */
  static async getPaymentStatistics(userId: string): Promise<{
    success: boolean;
    data?: {
      totalSpent: number;
      totalPayments: number;
      successfulPayments: number;
      failedPayments: number;
      lastPaymentDate?: Date;
    };
    error?: string;
  }> {
    try {
      const payments = await db
        .select()
        .from(paymentOrders)
        .where(eq(paymentOrders.userId, userId));

      const totalSpent = payments
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

      const successfulPayments = payments.filter((p) => p.status === 'completed').length;
      const failedPayments = payments.filter((p) => p.status === 'failed').length;

      const sortedPayments = [...payments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const lastPaymentDate = sortedPayments[0]?.createdAt;

      return {
        success: true,
        data: {
          totalSpent,
          totalPayments: payments.length,
          successfulPayments,
          failedPayments,
          lastPaymentDate,
        },
      };
    } catch (error) {
      logger.error('❌ PaymentHistoryService: Error getting payment statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment statistics',
      };
    }
  }
}

