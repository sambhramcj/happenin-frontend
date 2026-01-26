'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
  }>;
  type?: 'line' | 'bar';
}

export function RevenueChart({ data, type = 'line' }: RevenueChartProps) {
  const ChartComponent = type === 'line' ? LineChart : BarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ChartComponent data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
        <XAxis 
          dataKey="date" 
          stroke="var(--text-muted)"
          tick={{ fill: 'var(--text-secondary)' }}
        />
        <YAxis 
          stroke="var(--text-muted)"
          tick={{ fill: 'var(--text-secondary)' }}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'var(--text-primary)' }}
          formatter={(value: any) => [`₹${value}`, 'Revenue']}
        />
        <Legend />
        <DataComponent 
          type="monotone" 
          dataKey="revenue" 
          stroke="var(--color-primary)" 
          fill="var(--color-primary)"
          name="Revenue"
        />
      </ChartComponent>
    </ResponsiveContainer>
  );
}

interface UserGrowthChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
        <XAxis 
          dataKey="date" 
          stroke="var(--text-muted)"
          tick={{ fill: 'var(--text-secondary)' }}
        />
        <YAxis 
          stroke="var(--text-muted)"
          tick={{ fill: 'var(--text-secondary)' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'var(--text-primary)' }}
          formatter={(value: any) => [value, 'New Users']}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="#8B5CF6" 
          fill="#8B5CF6"
          name="New Users"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
