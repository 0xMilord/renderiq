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

      // ✅ OPTIMIZED: Get total count and payments with reference details in parallel
      const [totalResult, paymentsWithDetails] = await Promise.all([
        // Get total count
        db
          .select({ count: sql<number>`count(*)` })
          .from(paymentOrders)
          .where(and(...conditions)),
        // ✅ OPTIMIZED: Get payments with reference details using LEFT JOIN (single query instead of N+1)
        db
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
          .where(and(...conditions))
          .orderBy(desc(paymentOrders.createdAt))
          .limit(limit)
          .offset(offset),
      ]);

      const total = Number(totalResult[0]?.count || 0);

      // Enrich payments with reference details (already joined, just format)
      const enrichedPayments = paymentsWithDetails.map((row) => {
        const referenceDetails = row.payment.type === 'credit_package' 
          ? row.package 
          : row.payment.type === 'subscription'
          ? row.plan
          : null;

        return {
          ...row.payment,
          referenceDetails,
        };
      });

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
      // ✅ OPTIMIZED: Use SQL aggregation instead of fetching all payments and filtering in JavaScript
      const [stats] = await db
        .select({
          totalSpent: sql<number>`COALESCE(SUM(CASE WHEN ${paymentOrders.status} = 'completed' THEN ${paymentOrders.amount}::numeric ELSE 0 END), 0)`,
          totalPayments: sql<number>`COUNT(*)`,
          successfulPayments: sql<number>`COUNT(CASE WHEN ${paymentOrders.status} = 'completed' THEN 1 END)`,
          failedPayments: sql<number>`COUNT(CASE WHEN ${paymentOrders.status} = 'failed' THEN 1 END)`,
          lastPaymentDate: sql<Date | null>`MAX(${paymentOrders.createdAt})`,
        })
        .from(paymentOrders)
        .where(eq(paymentOrders.userId, userId));

      return {
        success: true,
        data: {
          totalSpent: Number(stats?.totalSpent || 0),
          totalPayments: Number(stats?.totalPayments || 0),
          successfulPayments: Number(stats?.successfulPayments || 0),
          failedPayments: Number(stats?.failedPayments || 0),
          lastPaymentDate: stats?.lastPaymentDate || undefined,
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

