'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Key, Activity, Zap } from 'lucide-react';
import { useApiUsageStats } from '@/lib/hooks/use-analytics';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis } from 'recharts';

const chartConfig = {
  value: {
    label: 'Value',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  chartData?: Array<{ date: string; value: number }>;
}

function StatCard({ label, value, icon: Icon, chartData }: StatCardProps) {
  const formattedChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    // Reduce data points for micro chart - only show last 7 days or fewer points
    const sliced = chartData.slice(-7);
    return sliced.map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: d.value,
    }));
  }, [chartData]);

  return (
    <Card className="flex-1 py-1 px-2 border-border/50 bg-card/50 min-w-0">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 h-full">
          <div className={cn("p-1 rounded-md shrink-0", "bg-primary/10")}>
            <Icon className="h-3 w-3 text-primary" />
          </div>
          <div className="flex flex-col min-w-0 flex-1 gap-0">
            <div className="text-[9px] text-muted-foreground truncate leading-tight">{label}</div>
            <div className="text-xs font-semibold text-foreground truncate leading-tight">{value}</div>
          </div>
          {formattedChartData.length > 0 && (
            <div className="h-8 w-16 shrink-0">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart data={formattedChartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={1}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ApiKeysHeaderStats() {
  const { data, loading, error } = useApiUsageStats({ days: 30 });

  // Prepare chart data for each stat - hooks must be called before any early returns
  const totalCallsChartData = useMemo(() => {
    if (!data?.dailyUsage) return [];
    // Show cumulative total calls over time
    let cumulative = 0;
    return data.dailyUsage.map((d) => {
      cumulative += d.apiCalls;
      return { date: d.date, value: cumulative };
    });
  }, [data?.dailyUsage]);

  const activeKeysChartData = useMemo(() => {
    if (!data?.dailyUsage) return [];
    // For active keys, show a flat line at the current value
    const currentValue = data.activeApiKeys ?? 0;
    return data.dailyUsage.map((d) => ({ date: d.date, value: currentValue }));
  }, [data?.dailyUsage, data?.activeApiKeys]);

  const avgPerDayChartData = useMemo(() => {
    if (!data?.dailyUsage) return [];
    // Show actual daily API calls (rolling average could be computed but simple daily is clearer)
    return data.dailyUsage.map((d) => ({ date: d.date, value: d.apiCalls }));
  }, [data?.dailyUsage]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-[180px]" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const statsData = [
    {
      label: 'Total Calls',
      value: (data.totalCalls ?? 0).toLocaleString(),
      icon: Activity,
      chartData: totalCallsChartData,
    },
    {
      label: 'Active Keys',
      value: (data.activeApiKeys ?? 0).toString(),
      icon: Key,
      chartData: activeKeysChartData,
    },
    {
      label: 'Avg/Day',
      value: Math.round(data.averagePerDay ?? 0).toLocaleString(),
      icon: Zap,
      chartData: avgPerDayChartData,
    },
  ];

  return (
    <div className="flex-1 flex items-center gap-2 min-w-0">
      {statsData.map((stat, index) => (
        <StatCard
          key={index}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          chartData={stat.chartData}
        />
      ))}
    </div>
  );
}

