'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentHistory } from '@/lib/hooks/use-payment-history';
import { Download, ArrowRight, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 5;

export function RecentPaymentsPaginated() {
  const { payments, loading } = usePaymentHistory({});
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil((payments?.length || 0) / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPayments = useMemo(
    () => (payments || []).slice(startIndex, endIndex),
    [payments, startIndex, endIndex]
  );

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

  if (loading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="shrink-0">
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Your latest payment transactions</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 h-[400px]">
          <div className="space-y-3 flex-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Payments
          </CardTitle>
          <CardDescription>Your latest payment transactions</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/billing/history">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 h-[400px]">
        {payments && payments.length > 0 ? (
          <>
            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
              {currentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {payment.referenceDetails?.name || payment.type === 'credit_package' ? 'Credit Package' : 'Subscription'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                        </p>
                        <Badge variant={getStatusBadgeVariant(payment.status)} className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {payment.currency || 'INR'} {parseFloat(payment.amount || '0').toFixed(2)}
                      </p>
                      {payment.invoiceNumber && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {payment.invoiceNumber}
                        </p>
                      )}
                    </div>
                    {payment.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReceipt(payment.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {/* Placeholder items to maintain height */}
              {currentPayments.length < ITEMS_PER_PAGE && Array.from({ length: ITEMS_PER_PAGE - currentPayments.length }).map((_, i) => (
                <div key={`placeholder-${i}`} className="h-[73px] opacity-0 pointer-events-none" aria-hidden="true" />
              ))}
            </div>
            
            {/* Pagination - Always show */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t shrink-0 h-[44px]">
              <div className="text-xs text-muted-foreground">
                {payments.length > 0 ? (
                  <>Showing {startIndex + 1}-{Math.min(endIndex, payments.length)} of {payments.length}</>
                ) : (
                  <>No payments</>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {totalPages > 0 ? (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      const showEllipsis = 
                        (page === currentPage - 2 && currentPage > 3) ||
                        (page === currentPage + 2 && currentPage < totalPages - 2);
                      
                      if (showEllipsis) {
                        return <span key={page} className="px-1 text-muted-foreground text-xs">...</span>;
                      }
                      
                      if (!showPage) return null;
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground px-2">1</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <div>
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No payments yet</p>
                <p className="text-xs">Your payment history will appear here</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/pricing">
                    View Pricing
                  </Link>
                </Button>
              </div>
            </div>
            {/* Pagination - Always show even when empty */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t shrink-0 h-[44px]">
              <div className="text-xs text-muted-foreground">No payments</div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">1</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

