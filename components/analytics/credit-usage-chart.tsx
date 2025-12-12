'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CreditStats, DailyUsageData } from '@/lib/services/analytics-service';

interface CreditUsageChartProps {
  data: CreditStats;
  dailyUsage: DailyUsageData[];
}

export function CreditUsageChart({ data, dailyUsage }: CreditUsageChartProps) {
  const typeData = [
    { name: 'Renders', value: data.byType.render },
    { name: 'Refunds', value: data.byType.refund },
    { name: 'Purchases', value: data.byType.purchase },
    { name: 'Subscriptions', value: data.byType.subscription },
    { name: 'Bonuses', value: data.byType.bonus },
  ];

  const dailyCreditsData = dailyUsage.map((item) => ({
    date: item.date.split('T')[0],
    credits: item.creditsSpent,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Credit Breakdown</CardTitle>
            <CardDescription>Spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyCreditsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="credits" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

