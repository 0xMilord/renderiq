'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RenderStats } from '@/lib/services/analytics-service';

interface RenderStatsChartProps {
  data: RenderStats;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export function RenderStatsChart({ data }: RenderStatsChartProps) {
  const typeData = [
    { name: 'Images', value: data.byType.image },
    { name: 'Videos', value: data.byType.video },
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
      <Card>
        <CardHeader>
          <CardTitle>By Type</CardTitle>
          <CardDescription>Image vs Video renders</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Status</CardTitle>
          <CardDescription>Render completion status</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Quality</CardTitle>
          <CardDescription>Quality tier distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={qualityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Platform</CardTitle>
          <CardDescription>Where renders were created</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
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

