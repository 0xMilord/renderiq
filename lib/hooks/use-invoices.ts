import { useState, useEffect, useCallback } from 'react';

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

      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.status) params.append('status', options.status);

      const response = await fetch(`/api/payments/invoices?${params.toString()}`);
      const data = await response.json();

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

