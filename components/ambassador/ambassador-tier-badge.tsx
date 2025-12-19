'use client';

import { Badge } from '@/components/ui/badge';
import { useAmbassador } from '@/lib/hooks/use-ambassador';
import { Skeleton } from '@/components/ui/skeleton';

export function AmbassadorTierBadge() {
  const { ambassador, loading } = useAmbassador();

  if (loading) {
    return <Skeleton className="h-6 w-20" />;
  }

  if (!ambassador || ambassador.status !== 'active') {
    return null;
  }

  // Calculate tier from referral count
  const referralCount = ambassador.totalReferrals || 0;
  let tierName = 'Bronze';
  let discountPercentage = 20;

  if (referralCount >= 100) {
    tierName = 'Platinum';
    discountPercentage = 35;
  } else if (referralCount >= 50) {
    tierName = 'Gold';
    discountPercentage = 30;
  } else if (referralCount >= 10) {
    tierName = 'Silver';
    discountPercentage = 25;
  }

  return (
    <Badge variant="secondary" className="h-6 px-2 text-xs font-medium">
      {tierName} ({discountPercentage}% discount)
    </Badge>
  );
}

