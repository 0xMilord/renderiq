'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ApiUsageStats } from '@/lib/services/analytics-service';

interface ApiUsageChartProps {
  data: ApiUsageStats;
}

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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
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

