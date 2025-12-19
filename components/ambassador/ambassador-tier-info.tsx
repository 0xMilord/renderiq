'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, TrendingUp, Award } from 'lucide-react';
import type { Ambassador } from '@/lib/db/schema';

interface AmbassadorTierInfoProps {
  ambassador: Ambassador;
  currentTier?: {
    tierName: string;
    discountPercentage: number;
  } | null;
  totalReferrals: number;
}

export function AmbassadorTierInfo({ ambassador, currentTier, totalReferrals }: AmbassadorTierInfoProps) {
  // Calculate next tier based on standard tiers
  const nextTier = useMemo(() => {
    const tiers = [
      { name: 'Bronze', minReferrals: 0, discount: 20 },
      { name: 'Silver', minReferrals: 10, discount: 25 },
      { name: 'Gold', minReferrals: 50, discount: 30 },
      { name: 'Platinum', minReferrals: 100, discount: 35 },
    ];

    // Find current tier index
    const currentTierIndex = tiers.findIndex(t => t.name === currentTier?.tierName || t.name === 'Bronze');
    
    // If already at highest tier, return null
    if (currentTierIndex === tiers.length - 1) {
      return null;
    }

    // Return next tier
    return tiers[currentTierIndex + 1];
  }, [currentTier]);

  const referralsNeeded = useMemo(() => {
    if (!nextTier) return 0;
    return Math.max(0, nextTier.minReferrals - totalReferrals);
  }, [nextTier, totalReferrals]);

  return (
    <div className="space-y-4">
      {/* Active Status Alert */}
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          Your ambassador account is active! Start sharing your referral links to earn commissions.
        </AlertDescription>
      </Alert>

      {/* Current Tier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4" />
            Current Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {currentTier?.tierName || 'Bronze'}
              </span>
              <Badge variant="default">
                {currentTier?.discountPercentage || 20}% discount
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {totalReferrals} referral{totalReferrals !== 1 ? 's' : ''} total
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Next Tier */}
      {nextTier && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Next Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{nextTier.name}</span>
                <Badge variant="secondary">
                  {nextTier.discount}% discount
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {referralsNeeded} more referral{referralsNeeded !== 1 ? 's' : ''} needed
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Upgrade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Upgrade</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {nextTier ? (
              <>
                Share your referral links to get {referralsNeeded} more referral{referralsNeeded !== 1 ? 's' : ''} and unlock the <strong>{nextTier.name}</strong> tier with {nextTier.discount}% discount for your referrals.
              </>
            ) : (
              <>
                You've reached the highest tier! Keep sharing to maximize your earnings.
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

