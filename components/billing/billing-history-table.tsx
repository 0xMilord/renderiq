'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Filter, Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useInvoices } from '@/lib/hooks/use-invoices';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function BillingHistoryTable() {
  const [filters, setFilters] = useState({
    type: 'all' as 'subscription' | 'credit_package' | 'all',
    status: 'all' as 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { invoices, loading: invoicesLoading } = useInvoices({ limit: 1000 });

  // Fetch all payments
  const fetchAllPayments = useCallback(async () => {
    try {
      setLoading(true);
      let allPaymentsData: any[] = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      // ✅ MIGRATED: Use server action instead of API route
      const { getPaymentHistoryAction } = await import('@/lib/actions/payment.actions');

      while (hasMore) {
        const data = await getPaymentHistoryAction({
          type: filters.type !== 'all' ? filters.type : undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          limit,
          offset,
        });

        if (data.success && data.data?.payments) {
          allPaymentsData = [...allPaymentsData, ...data.data.payments];
          hasMore = data.data.payments.length === limit;
          offset += limit;
        } else {
          hasMore = false;
        }
      }

      setAllPayments(allPaymentsData);
    } catch (error) {
      console.error('Error fetching all payments:', error);
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.status]);

  useEffect(() => {
    fetchAllPayments();
  }, [fetchAllPayments]);

  useEffect(() => {
    if (!invoicesLoading) {
      setAllInvoices(invoices || []);
    }
  }, [invoices, invoicesLoading]);

  // Update loading state
  useEffect(() => {
    if (!loading && !invoicesLoading) {
      setLoading(false);
    }
  }, [loading, invoicesLoading]);

  // Memoize download receipt handler
  const handleDownloadReceipt = useCallback(async (paymentOrderId: string) => {
    try {
      const response = await fetch(`/api/payments/receipt/${paymentOrderId}?download=true`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${paymentOrderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      toast.error('Error downloading receipt');
    }
  }, []);

  // Memoize download invoice handler
  const handleDownloadInvoice = useCallback(async (invoiceNumber: string) => {
    try {
      const invoice = allInvoices.find(inv => inv.invoiceNumber === invoiceNumber);
      if (!invoice?.pdfUrl) {
        toast.error('Invoice PDF not available');
        return;
      }

      const response = await fetch(invoice.pdfUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = invoice.pdfUrl.split('/').pop() || `invoice_${invoiceNumber}.pdf`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Error downloading invoice');
    }
  }, [allInvoices]);

  // Memoize status badge variant function
  const getStatusBadgeVariant = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  }, []);

  // Memoize filtered payments to avoid recalculating on every render
  const filteredPayments = useMemo(() => {
    return allPayments.filter(payment => {
      if (filters.type !== 'all' && payment.type !== filters.type) return false;
      if (filters.status !== 'all' && payment.status !== filters.status) return false;
      return true;
    });
  }, [allPayments, filters.type, filters.status]);

  // Memoize sorted payments to avoid recalculating on every render
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredPayments]);

  // Memoize summary calculations
  const summaryStats = useMemo(() => {
    if (sortedPayments.length === 0) {
      return {
        total: 0,
        completed: 0,
        totalAmount: 0,
        invoices: 0,
      };
    }

    const completedPayments = sortedPayments.filter(p => p.status === 'completed');
    return {
      total: sortedPayments.length,
      completed: completedPayments.length,
      totalAmount: completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0),
      invoices: sortedPayments.filter(p => p.invoiceNumber).length,
    };
  }, [sortedPayments]);

  const isLoading = loading || invoicesLoading;

  if (isLoading && allPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>All payment transactions and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>
              Complete history of all payments, subscriptions, and invoices
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 border rounded-lg bg-muted/50 shrink-0">
            <div>
              <label className="text-sm font-medium mb-2 block">Payment Type</label>
              <Select
                value={filters.type}
                onValueChange={(value: any) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit_package">Credit Package</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value: any) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Billing History Table */}
        <div className="flex-1 flex flex-col min-h-0">
          {sortedPayments.length === 0 ? (
            <div className="text-center py-12 flex-1 flex items-center justify-center">
              <div>
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">No billing history found</p>
                {filters.type !== 'all' || filters.status !== 'all' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ type: 'all', status: 'all' })}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto flex-1 flex flex-col min-h-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-[120px] text-right">Amount</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[150px]">Invoice</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(payment.createdAt), 'HH:mm')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {payment.type === 'credit_package' ? 'Credits' : 'Subscription'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {payment.referenceDetails?.name || 'N/A'}
                        </span>
                        {payment.type === 'credit_package' && payment.referenceDetails && (
                          <span className="text-xs text-muted-foreground">
                            {(payment.referenceDetails.credits || 0) + (payment.referenceDetails.bonusCredits || 0)} credits
                          </span>
                        )}
                        {payment.type === 'subscription' && payment.referenceDetails && (
                          <span className="text-xs text-muted-foreground">
                            {payment.referenceDetails.interval || 'monthly'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold">
                          {payment.currency || 'INR'} {parseFloat(payment.amount || '0').toFixed(2)}
                        </span>
                        {(payment.taxAmount && parseFloat(payment.taxAmount) > 0) && (
                          <span className="text-xs text-muted-foreground">
                            Tax: {payment.currency || 'INR'} {parseFloat(payment.taxAmount).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(payment.status)} className="text-xs">
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.invoiceNumber ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-xs">{payment.invoiceNumber}</span>
                          {allInvoices.some(inv => inv.invoiceNumber === payment.invoiceNumber) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs mt-1"
                              onClick={() => handleDownloadInvoice(payment.invoiceNumber!)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Invoice
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payment.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReceipt(payment.id)}
                            title="Download Receipt"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </div>

        {/* Summary */}
        {sortedPayments.length > 0 && (
          <div className="mt-6 pt-4 border-t shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Transactions</div>
                <div className="text-lg font-semibold">{summaryStats.total}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Completed</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {summaryStats.completed}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Amount</div>
                <div className="text-lg font-semibold">
                  {summaryStats.totalAmount.toFixed(2)} {sortedPayments[0]?.currency || 'INR'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Invoices</div>
                <div className="text-lg font-semibold">
                  {summaryStats.invoices}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

