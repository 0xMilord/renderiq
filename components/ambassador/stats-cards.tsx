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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

