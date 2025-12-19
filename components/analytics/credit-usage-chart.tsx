'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { CreditStats, DailyUsageData } from '@/lib/services/analytics-service';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface CreditUsageChartProps {
  data: CreditStats;
  dailyUsage: DailyUsageData[];
}

const chartConfig = {
  credits: {
    label: 'Credits Spent',
    color: 'var(--primary)',
  },
  value: {
    label: 'Value',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export function CreditUsageChart({ data, dailyUsage }: CreditUsageChartProps) {
  const typeData = [
    { name: 'Renders', value: data.byType.render },
    { name: 'Refunds', value: data.byType.refund },
    { name: 'Purchases', value: data.byType.purchase },
    { name: 'Subscriptions', value: data.byType.subscription },
    { name: 'Bonuses', value: data.byType.bonus },
  ];

  const dailyCreditsData = React.useMemo(() => {
    return dailyUsage.map((item) => ({
      date: item.date,
      credits: item.creditsSpent,
    }));
  }, [dailyUsage]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Credit Breakdown</CardTitle>
            <CardDescription>Spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
              <BarChart
                accessibilityLayer
                data={typeData}
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

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Credit statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{data.totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">{data.totalEarned.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className={`text-2xl font-bold ${data.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.netBalance >= 0 ? '+' : ''}{data.netBalance.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Per Day</p>
                <p className="text-2xl font-bold">{data.averagePerDay.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Credit Usage</CardTitle>
          <CardDescription>Credits spent per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={dailyCreditsData}
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
                    nameKey="credits"
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
                dataKey="credits"
                type="monotone"
                stroke="var(--color-credits)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

