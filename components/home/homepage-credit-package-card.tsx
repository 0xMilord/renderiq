'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GradientCard } from '@/components/ui/gradient-card';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

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

export function HomepageCreditPackageCard({ package: pkg }: HomepageCreditPackageCardProps) {
  const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <GradientCard
      title={pkg.name}
      description={pkg.description || undefined}
      isPopular={pkg.isPopular}
      className="h-full"
      glowColor="rgba(209, 242, 74, 0.7)"
    >
      {/* Credits and Pricing Information - 1 row, 2 columns */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Credits */}
        <div className="text-center">
          <div className={`text-2xl font-bold mb-0.5 ${isDarkMode ? 'text-white' : 'text-[hsl(0,0%,7%)]'}`}>
            {totalCredits.toLocaleString()}
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {pkg.credits.toLocaleString()} credits
            {pkg.bonusCredits && pkg.bonusCredits > 0 && (
              <span className="text-[hsl(72,87%,62%)]"> +{pkg.bonusCredits.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="text-center">
          <div className={`text-2xl font-bold mb-0.5 ${isDarkMode ? 'text-white' : 'text-[hsl(0,0%,7%)]'}`}>
            ₹{parseFloat(pkg.price).toLocaleString()}
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            ₹{Math.round(parseFloat(pkg.price) / totalCredits)}/credit
          </div>
        </div>
      </div>

      {/* Purchase Button */}
      <Link href="/pricing">
        <Button className="w-full bg-[hsl(72,87%,62%)] text-[hsl(0,0%,7%)] hover:bg-[hsl(72,87%,55%)] font-semibold">
          Purchase Credits
        </Button>
      </Link>
    </GradientCard>
  );
}

