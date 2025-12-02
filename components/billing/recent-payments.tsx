'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentHistory } from '@/lib/hooks/use-payment-history';
import { Download, ArrowRight, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function RecentPayments() {
  const { payments, loading } = usePaymentHistory({ limit: 5 });

  const handleDownloadReceipt = async (paymentOrderId: string) => {
    try {
      const response = await fetch(`/api/payments/receipt/${paymentOrderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.receiptUrl) {
          window.open(data.data.receiptUrl, '_blank');
        } else {
          toast.error('Receipt not available');
        }
      } else {
        toast.error('Failed to download receipt');
      }
    } catch (error) {
      toast.error('Error downloading receipt');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
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
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-8 h-8 rounded-full" />
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

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>
            Your payment history will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No payments yet</p>
            <Button asChild variant="outline">
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
        <CardDescription>
          Your latest payment transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.slice(0, 5).map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
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
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/billing/history">
              View All Payments
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

