'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCredits } from '@/lib/hooks/use-credits';
import { Coins, Plus, History, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function CreditsCard() {
  const { credits, loading } = useCredits();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credits Balance</CardTitle>
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

  if (!credits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credits Balance</CardTitle>
          <CardDescription>
            Unable to load credits information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  const creditsUsed = credits.totalSpent;
  const creditsEarned = credits.totalEarned;
  const creditsBalance = credits.balance;
  const creditsPercentage = creditsEarned > 0 ? (creditsUsed / creditsEarned) * 100 : 0;
  const isLowCredits = creditsBalance < 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Coins className="h-5 w-5" />
          <span>Credits Balance</span>
          {isLowCredits && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Low
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Manage your credits and view usage history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Balance */}
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground mb-2">
            {creditsBalance.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">Available Credits</p>
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Monthly Usage</span>
            <span className="text-muted-foreground">
              {creditsUsed} / {creditsEarned} used
            </span>
          </div>
          <Progress value={creditsPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{creditsEarned}</span>
          </div>
        </div>

        {/* Credit Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="font-semibold text-green-600">
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

        {/* Actions */}
        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/billing/credits">
              <Plus className="h-4 w-4 mr-2" />
              Buy More Credits
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/billing/credits/history">
              <History className="h-4 w-4 mr-2" />
              View History
            </Link>
          </Button>
        </div>

        {/* Low Credits Warning */}
        {isLowCredits && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-100/50 border border-yellow-200/50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              You&apos;re running low on credits. Consider upgrading your plan or purchasing more credits.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
