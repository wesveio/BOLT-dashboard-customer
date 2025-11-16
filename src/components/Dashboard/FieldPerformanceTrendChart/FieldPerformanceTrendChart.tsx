'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TrendDataPoint } from '@/hooks/useFormOptimizationMetrics';
import type { Period } from '@/utils/default-data';

interface FieldPerformanceTrendChartProps {
  trend: TrendDataPoint[];
  period: Period;
}

export function FieldPerformanceTrendChart({ trend, period }: FieldPerformanceTrendChartProps) {
  const chartData = useMemo(() => {
    if (trend.length === 0) {
      return [];
    }

    // Sort by date
    const sorted = [...trend].sort((a, b) => a.date.localeCompare(b.date));

    // Fill in missing dates for better visualization
    if (sorted.length > 0) {
      const startDate = new Date(sorted[0].date);
      const endDate = new Date(sorted[sorted.length - 1].date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const filledData: TrendDataPoint[] = [];
      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const existing = sorted.find((d) => d.date === dateStr);
        filledData.push(existing || {
          date: dateStr,
          avgCompletionRate: 0,
          avgErrorRate: 0,
          avgTimeToComplete: 0,
          optimizedSessions: 0,
        });
      }
      return filledData;
    }

    return sorted;
  }, [trend]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground/60">
        <p>No trend data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border border-default rounded-lg shadow-lg">
          <p className="font-semibold text-foreground mb-2">
            {new Date(payload[0].payload.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.dataKey === 'avgTimeToComplete'
                ? `${(entry.value / 1000).toFixed(2)}s`
                : `${(entry.value * 100).toFixed(1)}%`}
            </p>
          ))}
          {payload[0].payload.optimizedSessions !== undefined && (
            <div className="mt-2 pt-2 border-t border-default">
              <p className="text-xs text-foreground/70">
                Optimized Sessions: {payload[0].payload.optimizedSessions}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return period === 'today'
              ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis
          yAxisId="left"
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          label={{ value: 'Time (s)', angle: 90, position: 'insideRight', fill: '#6b7280' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="avgCompletionRate"
          name="Avg Completion Rate"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="avgErrorRate"
          name="Avg Error Rate"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgTimeToComplete"
          name="Avg Time (s)"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

