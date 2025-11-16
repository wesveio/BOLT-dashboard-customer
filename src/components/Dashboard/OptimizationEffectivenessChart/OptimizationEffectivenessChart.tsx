'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { StepMetrics } from '@/hooks/useFormOptimizationMetrics';

interface OptimizationEffectivenessChartProps {
  optimizedConversionRate: number;
  nonOptimizedConversionRate: number;
  byStep: {
    profile: StepMetrics;
    shipping: StepMetrics;
    payment: StepMetrics;
  };
}

export function OptimizationEffectivenessChart({
  optimizedConversionRate,
  nonOptimizedConversionRate,
  byStep,
}: OptimizationEffectivenessChartProps) {
  const chartData = [
    {
      step: 'Overall',
      'With Optimization': optimizedConversionRate,
      'Without Optimization': nonOptimizedConversionRate,
    },
    {
      step: 'Profile',
      'With Optimization': byStep.profile.optimizedConversionRate,
      'Without Optimization': byStep.profile.nonOptimizedConversionRate,
    },
    {
      step: 'Shipping',
      'With Optimization': byStep.shipping.optimizedConversionRate,
      'Without Optimization': byStep.shipping.nonOptimizedConversionRate,
    },
    {
      step: 'Payment',
      'With Optimization': byStep.payment.optimizedConversionRate,
      'Without Optimization': byStep.payment.nonOptimizedConversionRate,
    },
  ];

  const hasData = optimizedConversionRate > 0 || nonOptimizedConversionRate > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground/60">
        <p>No data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const improvement = data['With Optimization'] - data['Without Optimization'];
      return (
        <div className="bg-background p-3 border border-default rounded-lg shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.step}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
          {improvement !== 0 && (
            <div className="mt-2 pt-2 border-t border-default">
              <p className={`text-xs font-semibold ${improvement > 0 ? 'text-success' : 'text-danger'}`}>
                Improvement: {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
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
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="step"
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
          dataKey="With Optimization"
          fill="#8b5cf6"
          name="With Optimization"
        />
        <Bar
          dataKey="Without Optimization"
          fill="#9ca3af"
          name="Without Optimization"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

