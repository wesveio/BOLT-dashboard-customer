'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { InterventionMetricsByType } from '@/hooks/useInterventionMetrics';

interface InterventionEffectivenessChartProps {
  byType: Record<string, InterventionMetricsByType>;
  withInterventionRate: number;
  withoutInterventionRate: number;
}

export function InterventionEffectivenessChart({
  byType,
  withInterventionRate,
  withoutInterventionRate,
}: InterventionEffectivenessChartProps) {
  const chartData = Object.entries(byType).map(([type, data]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    'With Intervention': data.conversionRate,
    'Without Intervention': withoutInterventionRate,
    applied: data.applied,
    converted: data.converted,
  }));

  // Always include overall comparison, even if no type-specific data
  const overallData = [
    {
      type: 'Overall',
      'With Intervention': withInterventionRate,
      'Without Intervention': withoutInterventionRate,
    },
    ...chartData,
  ];

  // Show chart if we have any meaningful data (at least one rate > 0 or type data exists)
  const hasData = withInterventionRate > 0 || withoutInterventionRate > 0 || chartData.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground/60">
        <p>No data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border border-default rounded-lg shadow-lg">
          <p className="font-semibold text-foreground mb-2">{payload[0].payload.type}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
          {payload[0].payload.applied !== undefined && (
            <div className="mt-2 pt-2 border-t border-default">
              <p className="text-xs text-foreground/70">
                Applied: {payload[0].payload.applied} | Converted: {payload[0].payload.converted || 0}
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
      <BarChart data={overallData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="type"
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="With Intervention"
          fill="#8b5cf6"
          name="With Intervention"
        />
        <Bar
          dataKey="Without Intervention"
          fill="#9ca3af"
          name="Without Intervention"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

