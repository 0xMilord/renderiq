import { useState, useEffect, useCallback } from 'react';
import { getInvoicesAction } from '@/lib/actions/payment.actions';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  currency: string;
  status: string;
  pdfUrl?: string;
  createdAt: Date;
  paymentOrderId?: string;
}

export function useInvoices(options?: { limit?: number; offset?: number; status?: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ MIGRATED: Use server action instead of API route
      const data = await getInvoicesAction({
        limit: options?.limit,
        offset: options?.offset,
        status: options?.status,
      });

      if (data.success && data.data) {
        setInvoices(data.data);
      } else {
        setError(data.error || 'Failed to fetch invoices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [options?.limit, options?.offset, options?.status]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    refresh: fetchInvoices,
  };
}


