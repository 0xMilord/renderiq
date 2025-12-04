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
          </div>
          <p className="text-sm text-muted-foreground">
            {subscription?.subscription?.status === 'active' && subscription?.plan?.name 
              ? subscription.plan.name 
              : subscription?.subscription?.status === 'pending' && subscription?.plan?.name
              ? `${subscription.plan.name} (Pending)`
              : 'Free Plan'}
          </p>
        </div>

        {/* Next Billing Date */}
        {subscription?.subscription?.status === 'active' && subscription?.subscription?.currentPeriodEnd && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Next Billing</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
          </div>
        )}

        {/* Payment Method - Only show if subscription is active and we have payment method info */}
        {subscription?.subscription?.status === 'active' && subscription?.paymentMethod && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Method</span>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {subscription.paymentMethod.method === 'card' && subscription.paymentMethod.card?.last4
                ? `Card ending in ${subscription.paymentMethod.card.last4}`
                : subscription.paymentMethod.method === 'upi' && subscription.paymentMethod.vpa
                ? `UPI: ${subscription.paymentMethod.vpa}`
                : subscription.paymentMethod.method === 'wallet' && subscription.paymentMethod.wallet
                ? `Wallet: ${subscription.paymentMethod.wallet}`
                : subscription.paymentMethod.method === 'netbanking' && subscription.paymentMethod.bank
                ? `Net Banking: ${subscription.paymentMethod.bank}`
                : subscription.paymentMethod.method
                ? subscription.paymentMethod.method.charAt(0).toUpperCase() + subscription.paymentMethod.method.slice(1)
                : 'Managed by Razorpay'}
            </p>
          </div>
        )}

        {/* Low Credits Warning */}
        {creditsBalance < 5 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              You&apos;re running low on credits. Consider upgrading your plan or purchasing more credits.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
