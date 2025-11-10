'use client';

import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { formatCompactNumber, formatPercentage } from '@/utils/formatters';
import {
  PaintBrushIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import type { FormOptimizationMetricsResponse } from '@/hooks/useFormOptimizationMetrics';

interface FormOptimizationMetricsCardProps {
  metrics: FormOptimizationMetricsResponse;
  isLoading?: boolean;
}

export function FormOptimizationMetricsCard({ metrics, isLoading }: FormOptimizationMetricsCardProps) {
  return (
    <>
      <MetricCard
        title="Total Optimizations"
        value={formatCompactNumber(metrics.totalOptimizations, { threshold: 1_000_000 })}
        subtitle="Optimizations applied in period"
        icon={<PaintBrushIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Optimized Conversion"
        value={formatPercentage(metrics.optimizedConversionRate)}
        subtitle={`vs ${formatPercentage(metrics.nonOptimizedConversionRate)} without optimization`}
        icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Improvement Rate"
        value={formatPercentage(metrics.improvementRate)}
        subtitle="Conversion improvement vs baseline"
        icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
        trend={
          metrics.improvementRate !== 0
            ? {
                value: Math.abs(metrics.improvementRate),
                isPositive: metrics.improvementRate > 0,
              }
            : undefined
        }
      />
      <MetricCard
        title="Avg Completion Time"
        value={metrics.avgCompletionTime > 0 ? `${formatCompactNumber(metrics.avgCompletionTime / 1000, { threshold: 1_000_000, maximumFractionDigits: 1 })}s` : 'N/A'}
        subtitle="Average time to complete fields"
        icon={<ClockIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
    </>
  );
}

