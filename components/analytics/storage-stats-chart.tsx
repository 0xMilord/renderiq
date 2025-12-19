'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { StorageStats } from '@/lib/services/analytics-service';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface StorageStatsChartProps {
  data: StorageStats;
}

const chartConfig = {
  value: {
    label: 'Files',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export function StorageStatsChart({ data }: StorageStatsChartProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const mimeTypeData = Object.entries(data.byMimeType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Storage</CardTitle>
            <CardDescription>All time storage usage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatBytes(data.totalStorageUsed)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {data.fileCount.toLocaleString()} files
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Per Day</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatBytes(data.averagePerDay)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Storage per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Files</CardTitle>
            <CardDescription>Files stored</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.fileCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Files in storage
            </p>
          </CardContent>
        </Card>
      </div>

      {mimeTypeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Files by Type</CardTitle>
            <CardDescription>File count by MIME type category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
              <BarChart
                accessibilityLayer
                data={mimeTypeData}
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

      {mimeTypeData.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No storage data available.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

