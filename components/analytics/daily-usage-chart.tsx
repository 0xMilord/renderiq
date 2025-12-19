'use client';

import * as React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DailyUsageData } from '@/lib/services/analytics-service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface DailyUsageChartProps {
  data: DailyUsageData[];
}

const chartConfig = {
  views: {
    label: 'Daily Usage',
  },
  renders: {
    label: 'Renders Created',
    color: 'var(--primary)',
  },
  credits: {
    label: 'Credits Spent',
    color: 'var(--primary)',
  },
  apiCalls: {
    label: 'API Calls',
    color: 'var(--primary)',
  },
  storage: {
    label: 'Storage Used',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export function DailyUsageChart({ data }: DailyUsageChartProps) {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>('renders');

  const chartData = React.useMemo(() => {
    return data.map((item) => ({
      date: item.date,
      renders: item.rendersCreated,
      credits: item.creditsSpent,
      apiCalls: item.apiCalls,
      storage: item.storageUsed || 0,
    }));
  }, [data]);

  const total = React.useMemo(
    () => ({
      renders: chartData.reduce((acc, curr) => acc + curr.renders, 0),
      credits: chartData.reduce((acc, curr) => acc + curr.credits, 0),
      apiCalls: chartData.reduce((acc, curr) => acc + curr.apiCalls, 0),
      storage: chartData.reduce((acc, curr) => acc + curr.storage, 0),
    }),
    [chartData]
  );

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Daily Usage</CardTitle>
          <CardDescription>
            Your activity over the last 30 days
          </CardDescription>
        </div>
        <div className="flex">
          {(['renders', 'credits', 'apiCalls', 'storage'] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-muted-foreground text-xs">
                {chartConfig[key].label}
              </span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {key === 'storage' 
                  ? `${(total[key] / (1024 * 1024 * 1024)).toFixed(2)} GB`
                  : total[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[400px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

