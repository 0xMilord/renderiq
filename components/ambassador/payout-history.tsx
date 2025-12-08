'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, CreditCard } from 'lucide-react';
import type { AmbassadorPayout } from '@/lib/db/schema';

interface PayoutHistoryProps {
  payouts: AmbassadorPayout[];
}

export function PayoutHistory({ payouts }: PayoutHistoryProps) {
  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(parseFloat(amount.toString()));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      paid: 'default',
      pending: 'secondary',
      processing: 'outline',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (payouts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">
            No payouts yet. Payouts are processed weekly for pending commissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPaid = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.totalCommissions.toString()), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>{payouts.length} payout{payouts.length !== 1 ? 's' : ''} total</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Paid</div>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payouts.map((payout) => (
            <div key={payout.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-lg">
                      {formatCurrency(payout.totalCommissions)}
                    </span>
                    {getStatusBadge(payout.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {payout.commissionCount} commission{payout.commissionCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Period</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                  </div>
                </div>
                {payout.paidAt && (
                  <div>
                    <div className="text-muted-foreground">Paid On</div>
                    <div className="font-medium mt-1">{formatDate(payout.paidAt)}</div>
                  </div>
                )}
                {payout.paymentMethod && (
                  <div>
                    <div className="text-muted-foreground">Payment Method</div>
                    <div className="flex items-center gap-1 mt-1">
                      <CreditCard className="h-3 w-3" />
                      {payout.paymentMethod}
                    </div>
                  </div>
                )}
                {payout.paymentReference && (
                  <div>
                    <div className="text-muted-foreground">Reference</div>
                    <div className="font-mono text-xs mt-1">{payout.paymentReference}</div>
                  </div>
                )}
              </div>
              {payout.notes && (
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  <strong>Notes:</strong> {payout.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

