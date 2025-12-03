'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCredits } from '@/lib/hooks/use-credits';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { CreditCard, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function BillingOverview() {
  const { user } = useAuth();
  const { credits, loading: creditsLoading } = useCredits();
  const { data: subscription, loading: subscriptionLoading } = useSubscription(user?.id);

  if (creditsLoading || subscriptionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const creditsUsed = credits ? credits.totalSpent : 0;
  const creditsEarned = credits ? credits.totalEarned : 0;
  const creditsBalance = credits ? credits.balance : 0;
  // Monthly usage for progress bar (current billing period)
  const monthlyEarned = credits?.monthlyEarned || 0;
  const monthlySpent = credits?.monthlySpent || 0;
  const monthlyPercentage = monthlyEarned > 0 ? (monthlySpent / monthlyEarned) * 100 : 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Account Overview</CardTitle>
        <CardDescription>
          Your current account status and usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        {/* Credits Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Monthly Usage</span>
            <span className="text-sm text-muted-foreground">
              {monthlySpent > 0 || monthlyEarned > 0 ? (
                <>{monthlySpent} / {monthlyEarned} used</>
              ) : (
                <>{creditsUsed} / {creditsEarned} total</>
              )}
            </span>
          </div>
          <Progress value={monthlyEarned > 0 ? monthlyPercentage : (creditsEarned > 0 ? (creditsUsed / creditsEarned) * 100 : 0)} className="h-2" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">Available: {creditsBalance}</span>
            {creditsBalance < 5 && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Low Credits
              </Badge>
            )}
          </div>
        </div>

        {/* Current Plan */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Plan</span>
            <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
              {subscription?.status || 'Free'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {subscription?.plan?.name || 'Free Plan'}
          </p>
        </div>

        {/* Next Billing Date */}
        {subscription?.currentPeriodEnd && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Next Billing</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
          </div>
        )}

        {/* Payment Method */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Payment Method</span>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {subscription ? 'Managed by Razorpay' : 'No payment method'}
          </p>
          {!subscription && (
            <Button asChild variant="outline" size="sm" className="w-full mt-2">
              <Link href="/pricing">
                Add Payment Method
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
