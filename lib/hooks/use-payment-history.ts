import { useState, useEffect, useCallback } from 'react';

interface PaymentHistoryFilters {
  type?: 'subscription' | 'credit_package' | '';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | '';
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

      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', limit.toString());
      params.append('offset', currentOffset.toString());

      const response = await fetch(`/api/payments/history?${params.toString()}`);
      const data = await response.json();

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


