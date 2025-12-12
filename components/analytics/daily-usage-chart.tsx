'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyUsageData } from '@/lib/services/analytics-service';
import { format, parseISO } from 'date-fns';

interface DailyUsageChartProps {
  data: DailyUsageData[];
}

export function DailyUsageChart({ data }: DailyUsageChartProps) {
  const chartData = data.map((item) => ({
    date: format(parseISO(item.date), 'MMM dd'),
    renders: item.rendersCreated,
    credits: item.creditsSpent,
    apiCalls: item.apiCalls,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="renders"
          stroke="#8884d8"
          name="Renders Created"
          strokeWidth={2}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="credits"
          stroke="#82ca9d"
          name="Credits Spent"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="apiCalls"
          stroke="#ffc658"
          name="API Calls"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

