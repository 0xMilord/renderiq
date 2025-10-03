'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { Calendar, CreditCard, Settings, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function SubscriptionCard() {
  const { subscription, loading, cancelSubscription, reactivateSubscription } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
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

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>
            You're currently on the free plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Free Plan</h3>
              <p className="text-sm text-gray-600">10 credits per month</p>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/billing/plans">
                Upgrade Plan
              </Link>
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Upgrade to get more credits and features
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isActive = subscription.status === 'active';
  const isCanceled = subscription.cancelAtPeriodEnd;
  const isPastDue = subscription.status === 'past_due';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Subscription</span>
          <Badge 
            variant={
              isActive && !isCanceled ? 'default' : 
              isPastDue ? 'destructive' : 
              'secondary'
            }
          >
            {subscription.status === 'active' && isCanceled ? 'Canceling' : subscription.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          {subscription.plan?.name} - ${subscription.plan?.price}/{subscription.plan?.interval}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">{subscription.plan?.name}</h3>
              <p className="text-sm text-gray-600">
                {subscription.plan?.creditsPerMonth} credits per month
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">${subscription.plan?.price}</p>
              <p className="text-sm text-gray-500">per {subscription.plan?.interval}</p>
            </div>
          </div>

          {/* Billing Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium">Next Billing</p>
                <p className="text-gray-600">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium">Payment Method</p>
                <p className="text-gray-600">•••• 4242</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {isPastDue && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">
              Payment failed. Please update your payment method.
            </p>
          </div>
        )}

        {isCanceled && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isActive && !isCanceled ? (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => cancelSubscription(subscription.id)}
              >
                Cancel Subscription
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/billing/plans">
                  Change Plan
                </Link>
              </Button>
            </div>
          ) : isCanceled ? (
            <Button 
              className="w-full"
              onClick={() => reactivateSubscription(subscription.id)}
            >
              Reactivate Subscription
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link href="/billing/plans">
                Choose Plan
              </Link>
            </Button>
          )}
          
          <Button variant="ghost" size="sm" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
