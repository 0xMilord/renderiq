'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';
import type { AmbassadorCommission } from '@/lib/db/schema';

interface CommissionHistoryProps {
  commissions: Array<{
    commission: AmbassadorCommission;
    referral?: {
      referredUserId: string;
    } | null;
    subscription?: {
      id: string;
    } | null;
  }>;
}

export function CommissionHistory({ commissions }: CommissionHistoryProps) {
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
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      paid: 'default',
      pending: 'secondary',
      cancelled: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (commissions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">
            No commissions yet. Commissions are recorded when your referrals subscribe.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalEarnings = commissions.reduce(
    (sum, { commission }) => sum + parseFloat(commission.commissionAmount.toString()),
    0
  );

  const pendingEarnings = commissions
    .filter(({ commission }) => commission.status === 'pending')
    .reduce((sum, { commission }) => sum + parseFloat(commission.commissionAmount.toString()), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Commission History</CardTitle>
            <CardDescription>{commissions.length} commission{commissions.length !== 1 ? 's' : ''} total</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            {pendingEarnings > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {formatCurrency(pendingEarnings)} pending
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {commissions.map(({ commission }) => (
            <div key={commission.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-lg">
                      {formatCurrency(commission.commissionAmount)}
                    </span>
                    {getStatusBadge(commission.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {parseFloat(commission.commissionPercentage.toString())}% of{' '}
                    {formatCurrency(commission.subscriptionAmount)}
                    {parseFloat(commission.discountAmount.toString()) > 0 && (
                      <span> (discount: {formatCurrency(commission.discountAmount)})</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Period</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(commission.periodStart)} - {formatDate(commission.periodEnd)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Currency</div>
                  <div className="font-medium mt-1">{commission.currency}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-medium mt-1">
                    {new Date(commission.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

