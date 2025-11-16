'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ConversionByDevice } from '@/hooks/usePersonalizationMetrics';

interface PersonalizationConversionChartProps {
  conversionByDevice: Record<string, ConversionByDevice>;
  personalizedConversionRate: number;
  nonPersonalizedConversionRate: number;
}

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Mobile',
  desktop: 'Desktop',
  tablet: 'Tablet',
  unknown: 'Unknown',
};

export function PersonalizationConversionChart({
  conversionByDevice,
  personalizedConversionRate,
  nonPersonalizedConversionRate,
}: PersonalizationConversionChartProps) {
  const chartData = Object.entries(conversionByDevice).map(([device, data]) => ({
    device: DEVICE_LABELS[device] || device,
    'Personalized': data.conversionRate,
    'Non-Personalized': nonPersonalizedConversionRate,
    total: data.total,
    converted: data.converted,
  }));

  // Always include overall comparison
  const overallData = [
    {
      device: 'Overall',
      'Personalized': personalizedConversionRate,
      'Non-Personalized': nonPersonalizedConversionRate,
    },
    ...chartData,
  ];

  // Show chart if we have any meaningful data
  const hasData = personalizedConversionRate > 0 || nonPersonalizedConversionRate > 0 || chartData.length > 0;

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
          <p className="font-semibold text-foreground mb-2">{payload[0].payload.device}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
          {payload[0].payload.total !== undefined && (
            <div className="mt-2 pt-2 border-t border-default">
              <p className="text-xs text-foreground/70">
                Total: {payload[0].payload.total} | Converted: {payload[0].payload.converted || 0}
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
          dataKey="device"
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
          dataKey="Personalized"
          fill="#8b5cf6"
          name="Personalized"
        />
        <Bar
          dataKey="Non-Personalized"
          fill="#9ca3af"
          name="Non-Personalized"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

