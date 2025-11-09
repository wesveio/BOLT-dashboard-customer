'use client';

import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import {
  BoltIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import type { InterventionMetricsResponse } from '@/hooks/useInterventionMetrics';

interface InterventionMetricsCardProps {
  metrics: InterventionMetricsResponse;
  activeConfigs?: number; // Number of enabled intervention configurations
  isLoading?: boolean;
}

export function InterventionMetricsCard({ metrics, activeConfigs: activeConfigsProp, isLoading }: InterventionMetricsCardProps) {
  // Use provided activeConfigs or fall back to counting by type (for backward compatibility)
  const activeConfigs = activeConfigsProp !== undefined 
    ? activeConfigsProp 
    : Object.values(metrics.byType).filter((m) => m.total > 0).length;

  return (
    <>
      <MetricCard
        title="Total Interventions"
        value={formatNumber(metrics.totalInterventions)}
        subtitle="All interventions in period"
        icon={<BoltIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Conversion Rate"
        value={formatPercentage(metrics.overallConversionRate)}
        subtitle="Overall conversion with interventions"
        icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Active Configs"
        value={formatNumber(activeConfigs)}
        subtitle="Intervention types configured"
        icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Estimated ROI"
        value={metrics.estimatedROI > 0 ? formatPercentage(metrics.estimatedROI) : 'N/A'}
        subtitle="Return on investment"
        icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
    </>
  );
}

