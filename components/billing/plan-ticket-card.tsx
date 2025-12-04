'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { useCredits } from '@/lib/hooks/use-credits';
import { useAuth } from '@/lib/hooks/use-auth';
import { CreditCard, Zap, Calendar, Coins, AlertCircle, History, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function PlanTicketCard() {
  const { user } = useAuth();
  const { data: subscription, loading: subscriptionLoading } = useSubscription(user?.id);
  const { credits, loading: creditsLoading } = useCredits();

  if (subscriptionLoading || creditsLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isActive = subscription?.subscription?.status === 'active';
  const isPending = subscription?.subscription?.status === 'pending';
  const isCanceled = subscription?.subscription?.cancelAtPeriodEnd;
  const isPastDue = subscription?.subscription?.status === 'past_due';
  const isPro = isActive && !isCanceled;
  const planName = (isActive && subscription?.plan?.name) ? subscription.plan.name : 'Free';
  const planPrice = subscription?.plan?.price || '0';
  const planInterval = subscription?.plan?.interval || 'month';
  const creditsBalance = credits?.balance || 0;
  const creditsEarned = credits?.totalEarned || 0;
  const creditsUsed = credits?.totalSpent || 0;
  // Monthly usage for progress bar (current billing period)
  const monthlyEarned = credits?.monthlyEarned || 0;
  const monthlySpent = credits?.monthlySpent || 0;
  const monthlyPercentage = monthlyEarned > 0 ? (monthlySpent / monthlyEarned) * 100 : 0;
  const isLowCredits = creditsBalance < 5;
  const creditsPerMonth = subscription?.plan?.creditsPerMonth || 0;
  const nextBilling = subscription?.subscription?.currentPeriodEnd 
    ? new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-card via-card to-muted/20 h-full flex flex-col">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-12 -mb-12 blur-2xl" />

      <CardContent className="relative z-10 flex-1 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Plan Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold">Current Plan</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      isActive && !isCanceled ? 'default' : 
                      isPending ? 'outline' :
                      isPastDue ? 'destructive' : 
                      'secondary'
                    }
                    className="text-sm font-semibold px-3 py-1"
                  >
                    {subscription?.subscription?.status === 'active' && isCanceled ? 'Canceling' : 
                     subscription?.subscription?.status === 'pending' ? 'Pending Payment' :
                     subscription?.subscription?.status === 'active' ? planName :
                     subscription?.subscription?.status || 'Free'}
                  </Badge>
                  {isLowCredits && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Low Credits
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {isPro && subscription?.plan && (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{subscription.plan.name}</h3>
                    <div className="text-right">
                      <p className="font-semibold">${subscription.plan.price}</p>
                      <p className="text-xs text-muted-foreground">per {subscription.plan.interval}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription.plan.creditsPerMonth} credits per month
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Next Billing</p>
                    <p className="text-muted-foreground">
                      {isPro && nextBilling ? nextBilling : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - 3 columns below Next Billing */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button asChild size="sm" className="w-full">
                  <Link href="/pricing">
                    <Plus className="h-4 w-4 mr-2" />
                    Buy Credits
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/dashboard/billing/history">
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </Link>
                </Button>
                {!isPro ? (
                  <Button size="sm" asChild className="w-full">
                    <Link href="/pricing">
                      Upgrade to Pro
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/pricing">
                      Change Plan
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {isPending && (
              <div className="flex items-center gap-2 p-3 bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Payment is processing. Your subscription will be activated once payment is confirmed.
                </p>
              </div>
            )}

            {isPastDue && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">
                  Payment failed. Please update your payment method.
                </p>
              </div>
            )}

            {isCanceled && subscription?.subscription?.currentPeriodEnd && (
              <div className="flex items-center gap-2 p-3 bg-yellow-100/50 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  Your subscription will end on {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            )}

          </div>

          {/* Right side - Credits Info (2 columns) */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Available
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {creditsBalance.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Credits
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Earned
                  </span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {creditsEarned.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total
                </div>
              </div>
            </div>

            {/* Monthly Usage Progress */}
            {(monthlyEarned > 0 || monthlySpent > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Monthly Usage</span>
                  <span className="text-muted-foreground">
                    {monthlySpent} / {monthlyEarned} used
                  </span>
                </div>
                <Progress value={monthlyPercentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{monthlyEarned}</span>
                </div>
              </div>
            )}

            {/* Credit Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-semibold text-green-600 dark:text-green-400">
                  +{creditsEarned.toLocaleString()}
                </div>
                <div className="text-muted-foreground">Total Earned</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-semibold text-destructive">
                  -{creditsUsed.toLocaleString()}
                </div>
                <div className="text-muted-foreground">Total Spent</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

