'use client';

import { useAnalytics } from '@/lib/hooks/use-analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BarChart3, TrendingUp, CreditCard, Zap, Database, FolderOpen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { RenderStatsChart } from '@/components/analytics/render-stats-chart';
import { CreditUsageChart } from '@/components/analytics/credit-usage-chart';
import { ApiUsageChart } from '@/components/analytics/api-usage-chart';
import { DailyUsageChart } from '@/components/analytics/daily-usage-chart';
import { StorageStatsChart } from '@/components/analytics/storage-stats-chart';
import { ProjectsStatsChart } from '@/components/analytics/projects-stats-chart';
import { StatsCards } from '@/components/analytics/stats-cards';

export default function AnalyticsPage() {
  const { data, loading, error, refetch } = useAnalytics({ days: 30 });
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button
              onClick={() => refetch()}
              className="ml-2 underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No analytics data available</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Stats Cards */}
      <StatsCards data={data} />

      {/* Charts */}
      <Tabs value={activeTab} className="space-y-4">

        <TabsContent value="overview" className="space-y-4">
          <DailyUsageChart data={data.dailyUsage} />
        </TabsContent>

        <TabsContent value="renders" className="space-y-4">
          <RenderStatsChart data={data.renderStats} />
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          <CreditUsageChart data={data.creditStats} dailyUsage={data.dailyUsage} />
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <ApiUsageChart data={data.apiUsageStats} />
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <StorageStatsChart data={data.storageStats} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <ProjectsStatsChart data={data.projectsStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

