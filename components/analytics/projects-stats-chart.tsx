'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PolarGrid, RadialBar, RadialBarChart } from 'recharts';
import { ProjectsStats } from '@/lib/services/analytics-service';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface ProjectsStatsChartProps {
  data: ProjectsStats;
}

const barChartConfig = {
  value: {
    label: 'Value',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const radialChartConfig = {
  projects: {
    label: 'Projects',
  },
  render: {
    label: 'Render',
    color: 'var(--primary)',
  },
  tools: {
    label: 'Tools',
    color: 'var(--primary)',
  },
  canvas: {
    label: 'Canvas',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export function ProjectsStatsChart({ data }: ProjectsStatsChartProps) {
  const platformData = [
    { platform: 'render', projects: data.byPlatform.render, fill: 'var(--color-render)' },
    { platform: 'tools', projects: data.byPlatform.tools, fill: 'var(--color-tools)' },
    { platform: 'canvas', projects: data.byPlatform.canvas, fill: 'var(--color-canvas)' },
  ];

  const statusData = [
    { name: 'Completed', value: data.byStatus.completed },
    { name: 'Processing', value: data.byStatus.processing },
    { name: 'Failed', value: data.byStatus.failed },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Projects</CardTitle>
            <CardDescription>All projects created</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalProjects.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {data.totalRenders.toLocaleString()} total renders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Renders</CardTitle>
            <CardDescription>Per project</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.averageRendersPerProject.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Renders per project
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Renders</CardTitle>
            <CardDescription>Across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalRenders.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              In {data.totalProjects} projects
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>By Platform</CardTitle>
            <CardDescription>Projects by platform</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={radialChartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <RadialBarChart data={platformData} innerRadius={30} outerRadius={100}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="platform" />}
                />
                <PolarGrid gridType="circle" />
                <RadialBar dataKey="projects" />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
            <CardDescription>Project completion status</CardDescription>
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
      </div>
    </div>
  );
}

