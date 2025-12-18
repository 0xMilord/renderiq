'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VercelCard } from '@/components/ui/vercel-card';
import { memo } from 'react';
import { useCurrency } from '@/lib/hooks/use-currency';

interface HomepageCreditPackageCardProps {
  package: {
    id: string;
    name: string;
    description?: string;
    credits: number;
    bonusCredits?: number;
    price: string;
    isPopular?: boolean;
  };
}

function HomepageCreditPackageCardComponent({ package: pkg }: HomepageCreditPackageCardProps) {
  const { convert, format, loading } = useCurrency();
  const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
  const priceInINR = parseFloat(pkg.price);
  const convertedPrice = convert(priceInINR);
  const pricePerCredit = convert(priceInINR / totalCredits);

  return (
    <VercelCard className="h-full" showIcons={true} bordered>
      <div className="p-4">
        {/* Title */}
        <div className="mb-3">
          <h4 className="text-lg font-bold">{pkg.name}</h4>
          {pkg.description && (
            <p className="text-xs text-muted-foreground">{pkg.description}</p>
          )}
          {pkg.isPopular && (
            <span className="text-xs text-primary font-medium">Popular</span>
          )}
        </div>

        {/* Credits and Pricing Information - 1 row, 2 columns */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Credits */}
          <div className="text-center">
            <div className="text-2xl font-bold mb-0.5">
              {totalCredits.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {pkg.credits.toLocaleString()} credits
              {pkg.bonusCredits && pkg.bonusCredits > 0 && (
                <span className="text-primary"> +{pkg.bonusCredits.toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center">
            <div className="text-2xl font-bold mb-0.5">
              {loading ? '...' : format(convertedPrice)}
            </div>
            <div className="text-xs text-muted-foreground">
              {loading ? '...' : format(pricePerCredit)}/credit
            </div>
          </div>
        </div>

        {/* Purchase Button */}
        <Link href="/pricing">
          <Button className="w-full" variant="outline">
            Purchase Credits
          </Button>
        </Link>
      </div>
    </VercelCard>
  );
}

// ✅ OPTIMIZED: Memoize component to prevent unnecessary re-renders in lists
export const HomepageCreditPackageCard = memo(HomepageCreditPackageCardComponent);

