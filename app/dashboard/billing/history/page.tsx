'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2, Calendar, FileText } from 'lucide-react';
import { usePaymentHistory } from '@/lib/hooks/use-payment-history';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PaymentHistoryPage() {
  const [filters, setFilters] = useState({
    type: 'all' as 'subscription' | 'credit_package' | 'all',
    status: 'all' as 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'all',
    startDate: '',
    endDate: '',
  });

  const { payments, loading, total, limit, offset, loadMore, hasMore } = usePaymentHistory(filters);

  // Memoize download receipt handler
  const handleDownloadReceipt = useCallback(async (paymentOrderId: string) => {
    try {
      // Fetch PDF with download parameter
      const response = await fetch(`/api/payments/receipt/${paymentOrderId}?download=true`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      // Get PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${paymentOrderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      toast.error('Error downloading receipt');
    }
  }, []);

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

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Filters in Header Area */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b bg-background shrink-0">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Select
            value={filters.type}
            onValueChange={(value) => setFilters({ ...filters, type: value as any })}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Payment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit_package">Credit Package</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value as any })}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
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

          <Input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full sm:w-[180px]"
          />

          <Input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="w-full sm:w-[180px]"
          />
        </div>
      </div>

      {/* Payment History Table */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="w-full space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {total} {total === 1 ? 'transaction' : 'transactions'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && payments.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No payment history found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Date</TableHead>
                        <TableHead className="text-xs sm:text-sm">Type</TableHead>
                        <TableHead className="text-xs sm:text-sm">Item</TableHead>
                        <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm">Invoice</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.type === 'credit_package' ? 'Credits' : 'Subscription'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.referenceDetails?.name || 'N/A'}
                            {payment.type === 'credit_package' && payment.referenceDetails && (
                              <span className="text-xs text-muted-foreground block">
                                {(payment.referenceDetails.credits || 0) + (payment.referenceDetails.bonusCredits || 0)} credits
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.currency || 'INR'} {parseFloat(payment.amount || '0').toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(payment.status)}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.invoiceNumber ? (
                              <span className="font-mono text-xs">{payment.invoiceNumber}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">Pending</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.status === 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadReceipt(payment.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {hasMore && (
                  <div className="mt-4 text-center">
                    <Button onClick={loadMore} variant="outline" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}


