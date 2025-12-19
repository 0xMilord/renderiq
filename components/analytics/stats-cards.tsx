'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsData } from '@/lib/actions/analytics.actions';
import { BarChart3, CreditCard, Zap, TrendingUp, CheckCircle, XCircle, Database, FolderOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StatsCardsProps {
  data: AnalyticsData;
}

export function StatsCards({ data }: StatsCardsProps) {
  const { renderStats, creditStats, apiUsageStats, userActivityStats, storageStats, projectsStats } = data;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

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
      title: 'Storage Used',
      value: formatBytes(storageStats.totalStorageUsed),
      description: `${storageStats.fileCount.toLocaleString()} files`,
      icon: Database,
      trend: `Avg ${formatBytes(storageStats.averagePerDay)}/day`,
    },
    {
      title: 'Projects',
      value: projectsStats.totalProjects.toLocaleString(),
      description: `${projectsStats.totalRenders.toLocaleString()} total renders`,
      icon: FolderOpen,
      trend: `${projectsStats.averageRendersPerProject.toFixed(1)} renders/project`,
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

