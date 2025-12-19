'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PolarGrid, RadialBar, RadialBarChart } from 'recharts';
import { RenderStats } from '@/lib/services/analytics-service';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface RenderStatsChartProps {
  data: RenderStats;
}

const barChartConfig = {
  value: {
    label: 'Value',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const radialChartConfig = {
  renders: {
    label: 'Renders',
  },
  images: {
    label: 'Images',
    color: 'var(--primary)',
  },
  videos: {
    label: 'Videos',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export function RenderStatsChart({ data }: RenderStatsChartProps) {
  const typeData = [
    { type: 'images', renders: data.byType.image, fill: 'var(--color-images)' },
    { type: 'videos', renders: data.byType.video, fill: 'var(--color-videos)' },
  ];

  const statusData = [
    { name: 'Completed', value: data.byStatus.completed },
    { name: 'Failed', value: data.byStatus.failed },
    { name: 'Pending', value: data.byStatus.pending },
    { name: 'Processing', value: data.byStatus.processing },
  ];

  const qualityData = [
    { name: 'Standard', value: data.byQuality.standard },
    { name: 'High', value: data.byQuality.high },
    { name: 'Ultra', value: data.byQuality.ultra },
  ];

  const platformData = [
    { name: 'Web App', value: data.byPlatform.render },
    { name: 'Tools', value: data.byPlatform.tools },
    { name: 'Canvas', value: data.byPlatform.canvas },
    { name: 'Plugins', value: data.byPlatform.plugin },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>By Type</CardTitle>
          <CardDescription>Image vs Video renders</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={radialChartConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <RadialBarChart data={typeData} innerRadius={30} outerRadius={100}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="type" />}
              />
              <PolarGrid gridType="circle" />
              <RadialBar dataKey="renders" />
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Status</CardTitle>
          <CardDescription>Render completion status</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="aspect-auto h-[300px] w-full">
            <BarChart
              accessibilityLayer
              data={statusData}
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
          <CardTitle>By Quality</CardTitle>
          <CardDescription>Quality tier distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="aspect-auto h-[300px] w-full">
            <BarChart
              accessibilityLayer
              data={qualityData}
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
          <CardTitle>By Platform</CardTitle>
          <CardDescription>Where renders were created</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="aspect-auto h-[300px] w-full">
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

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Average processing time and success rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Average Processing Time</p>
              <p className="text-2xl font-bold">
                {data.averageProcessingTime > 0
                  ? `${(data.averageProcessingTime / 1000).toFixed(1)}s`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">{data.successRate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

