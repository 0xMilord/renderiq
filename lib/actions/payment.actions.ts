'use server';

import { getCachedUser } from '@/lib/services/auth-cache';
import { PaymentHistoryService } from '@/lib/services/payment-history.service';
import { InvoiceService } from '@/lib/services/invoice.service';
import { logger } from '@/lib/utils/logger';

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


