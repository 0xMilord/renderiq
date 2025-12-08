'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, CreditCard } from 'lucide-react';
import type { AmbassadorReferral } from '@/lib/db/schema';

interface ReferralListProps {
  referrals: Array<{
    referral: AmbassadorReferral;
    user?: {
      name: string | null;
      email: string;
    } | null;
    link?: {
      campaignName: string | null;
    } | null;
  }>;
}

export function ReferralList({ referrals }: ReferralListProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      active: 'default',
      pending: 'secondary',
      completed: 'outline',
      expired: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (referrals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">
            No referrals yet. Start sharing your links to earn commissions!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referrals</CardTitle>
        <CardDescription>{referrals.length} referral{referrals.length !== 1 ? 's' : ''} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {referrals.map(({ referral, user, link }) => (
            <div key={referral.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {user?.name || user?.email || 'Unknown User'}
                    </span>
                    {getStatusBadge(referral.status)}
                  </div>
                  {link?.campaignName && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Campaign: {link.campaignName}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Signed Up</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(referral.signupAt)}
                  </div>
                </div>
                {referral.firstSubscriptionAt && (
                  <div>
                    <div className="text-muted-foreground">First Subscription</div>
                    <div className="flex items-center gap-1 mt-1">
                      <CreditCard className="h-3 w-3" />
                      {formatDate(referral.firstSubscriptionAt)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground">Commission Earned</div>
                  <div className="font-semibold mt-1">
                    ${parseFloat(referral.totalCommissionEarned.toString()).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Months Remaining</div>
                  <div className="font-semibold mt-1">
                    {referral.commissionMonthsRemaining}
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

