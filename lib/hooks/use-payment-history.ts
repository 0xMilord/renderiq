import { useState, useEffect, useCallback } from 'react';
import { getPaymentHistoryAction } from '@/lib/actions/payment.actions';

interface PaymentHistoryFilters {
  type?: 'subscription' | 'credit_package' | 'all';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'all';
  startDate?: string;
  endDate?: string;
}

interface Payment {
  id: string;
  type: 'subscription' | 'credit_package';
  amount: string;
  currency: string;
  status: string;
  createdAt: Date;
  invoiceNumber?: string;
  receiptPdfUrl?: string;
  referenceDetails?: any;
}

export function usePaymentHistory(filters: PaymentHistoryFilters = {}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPayments = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;

      // ✅ MIGRATED: Use server action instead of API route
      const data = await getPaymentHistoryAction({
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        limit,
        offset: currentOffset,
      });

      if (data.success && data.data) {
        if (reset) {
          setPayments(data.data.payments || []);
          setOffset(limit);
        } else {
          setPayments((prev) => [...prev, ...(data.data.payments || [])]);
          setOffset((prev) => prev + limit);
        }
        setTotal(data.data.total || 0);
        setHasMore((data.data.payments || []).length === limit);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, limit, offset]);

  useEffect(() => {
    setOffset(0);
    setPayments([]);
    fetchPayments(true);
  }, [filters.type, filters.status, filters.startDate, filters.endDate]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPayments(false);
    }
  }, [loading, hasMore, fetchPayments]);

  return {
    payments,
    loading,
    total,
    limit,
    offset,
    hasMore,
    loadMore,
    refresh: () => fetchPayments(true),
  };
}


