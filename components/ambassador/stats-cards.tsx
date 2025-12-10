'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, Clock, TrendingUp, CreditCard } from 'lucide-react';
import type { AmbassadorStats } from '@/lib/services/ambassador.service';

interface StatsCardsProps {
  stats: AmbassadorStats;
}

export function AmbassadorStatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Referrals',
      value: stats.totalReferrals.toString(),
      icon: Users,
      description: 'Users who signed up via your links',
    },
    {
      title: 'Active Subscribers',
      value: stats.activeSubscribers.toString(),
      icon: CreditCard,
      description: 'Referrals with active subscriptions',
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(stats.totalEarnings),
      icon: DollarSign,
      description: 'All-time commission earnings',
    },
    {
      title: 'Pending Earnings',
      value: formatCurrency(stats.pendingEarnings),
      icon: Clock,
      description: 'Awaiting payout',
    },
    {
      title: 'Paid Earnings',
      value: formatCurrency(stats.paidEarnings),
      icon: DollarSign,
      description: 'Total amount paid out',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Signups → Subscriptions',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="p-2 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight pr-1">{card.title}</CardTitle>
              <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-0 pt-1 sm:pt-2">
              <div className="text-base sm:text-xl md:text-2xl font-bold leading-tight">{card.value}</div>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-tight line-clamp-2">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

