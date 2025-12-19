'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ApiUsageStats } from '@/lib/services/analytics-service';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface ApiUsageChartProps {
  data: ApiUsageStats;
}

const chartConfig = {
  value: {
    label: 'API Calls',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export function ApiUsageChart({ data }: ApiUsageChartProps) {
  const platformData = Object.entries(data.byPlatform).map(([platform, count]) => ({
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    value: count,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total API Calls</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalCalls.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Avg {data.averagePerDay.toFixed(1)} calls/day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active API Keys</CardTitle>
            <CardDescription>Currently in use</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.activeApiKeys}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {data.uniqueApiKeys} total keys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Per Day</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.averagePerDay.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              API calls per day
            </p>
          </CardContent>
        </Card>
      </div>

      {platformData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage by Platform</CardTitle>
            <CardDescription>API calls by plugin platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
              <BarChart
                accessibilityLayer
                data={platformData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="value" fill="var(--color-value)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {platformData.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No API usage data available. Start using the API to see statistics here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

