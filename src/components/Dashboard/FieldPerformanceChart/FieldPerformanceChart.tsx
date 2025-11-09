'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { FieldPerformance } from '@/hooks/useFormOptimizationMetrics';

interface FieldPerformanceChartProps {
  fields: FieldPerformance[];
}

export function FieldPerformanceChart({ fields }: FieldPerformanceChartProps) {
  // Group fields by step and prepare chart data
  const fieldsByStep: Record<string, FieldPerformance[]> = {};
  fields.forEach((field) => {
    if (!fieldsByStep[field.step]) {
      fieldsByStep[field.step] = [];
    }
    fieldsByStep[field.step].push(field);
  });

  // Create chart data - show top fields per step
  const chartData: Array<{
    name: string;
    step: string;
    'Completion Rate': number;
    'Error Rate': number;
    'Avg Time (s)': number;
  }> = [];

  Object.entries(fieldsByStep).forEach(([step, stepFields]) => {
    // Sort by completion rate and take top 5 per step
    const topFields = [...stepFields]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    topFields.forEach((field) => {
      chartData.push({
        name: `${field.fieldName} (${step})`,
        step,
        'Completion Rate': field.completionRate * 100,
        'Error Rate': field.errorRate * 100,
        'Avg Time (s)': field.avgTimeToComplete / 1000, // Convert ms to seconds
      });
    });
  });

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No field performance data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.dataKey === 'Avg Time (s)' 
                ? `${entry.value.toFixed(2)}s`
                : `${entry.value.toFixed(1)}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={100}
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 11 }}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="Completion Rate"
          fill="#10b981"
          name="Completion Rate (%)"
        />
        <Bar
          dataKey="Error Rate"
          fill="#ef4444"
          name="Error Rate (%)"
        />
        <Bar
          dataKey="Avg Time (s)"
          fill="#3b82f6"
          name="Avg Time (seconds)"
          yAxisId={0}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

