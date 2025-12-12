'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsData } from '@/lib/actions/analytics.actions';
import { BarChart3, CreditCard, Zap, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StatsCardsProps {
  data: AnalyticsData;
}

export function StatsCards({ data }: StatsCardsProps) {
  const { renderStats, creditStats, apiUsageStats, userActivityStats } = data;

  const cards = [
    {
      title: 'Total Renders',
      value: renderStats.total.toLocaleString(),
      description: `${renderStats.byStatus.completed} completed`,
      icon: BarChart3,
      trend: renderStats.successRate > 0 ? `${renderStats.successRate.toFixed(1)}% success rate` : 'No renders yet',
    },
    {
      title: 'Credits Spent',
      value: creditStats.totalSpent.toLocaleString(),
      description: `${creditStats.totalEarned.toLocaleString()} earned`,
      icon: CreditCard,
      trend: `Avg ${creditStats.averagePerDay.toFixed(1)}/day`,
    },
    {
      title: 'API Calls',
      value: apiUsageStats.totalCalls.toLocaleString(),
      description: `${apiUsageStats.activeApiKeys} active keys`,
      icon: Zap,
      trend: `Avg ${apiUsageStats.averagePerDay.toFixed(1)}/day`,
    },
    {
      title: 'Account Activity',
      value: userActivityStats.totalLogins.toLocaleString(),
      description: userActivityStats.lastLoginAt
        ? `Last login ${formatDistanceToNow(userActivityStats.lastLoginAt, { addSuffix: true })}`
        : 'Never logged in',
      icon: TrendingUp,
      trend: `${userActivityStats.accountAge} days old`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-xs text-muted-foreground mt-1">{card.trend}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

