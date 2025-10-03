'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/hooks/use-auth';
import { useCredits } from '@/lib/hooks/use-credits';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { CreditCard, Calendar, AlertCircle } from 'lucide-react';

export function BillingOverview() {
  const { user } = useAuth();
  const { credits, loading: creditsLoading } = useCredits();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  if (creditsLoading || subscriptionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const creditsUsed = credits ? credits.totalSpent : 0;
  const creditsEarned = credits ? credits.totalEarned : 0;
  const creditsBalance = credits ? credits.balance : 0;
  const creditsPercentage = creditsEarned > 0 ? (creditsUsed / creditsEarned) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Overview</CardTitle>
        <CardDescription>
          Your current account status and usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credits Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Credits Usage</span>
            <span className="text-sm text-gray-500">
              {creditsUsed} / {creditsEarned} used
            </span>
          </div>
          <Progress value={creditsPercentage} className="h-2" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">Available: {creditsBalance}</span>
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
          <p className="text-sm text-gray-600">
            {subscription?.plan?.name || 'Free Plan'}
          </p>
        </div>

        {/* Next Billing Date */}
        {subscription?.currentPeriodEnd && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Next Billing</span>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Payment Method */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Payment Method</span>
            <CreditCard className="h-4 w-4 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">
            {subscription ? '•••• 4242' : 'No payment method'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
