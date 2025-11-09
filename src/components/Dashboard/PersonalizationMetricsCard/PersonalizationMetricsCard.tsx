'use client';

import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import {
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import type { PersonalizationMetricsResponse } from '@/hooks/usePersonalizationMetrics';

interface PersonalizationMetricsCardProps {
  metrics: PersonalizationMetricsResponse;
  isLoading?: boolean;
}

export function PersonalizationMetricsCard({ metrics, isLoading }: PersonalizationMetricsCardProps) {
  return (
    <>
      <MetricCard
        title="Total Profiles"
        value={formatNumber(metrics.totalProfiles)}
        subtitle="All user profiles created"
        icon={<UserGroupIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Active Profiles"
        value={formatNumber(metrics.activeProfiles)}
        subtitle="Updated in last 24h"
        icon={<ClockIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Personalization Rate"
        value={formatPercentage(metrics.personalizationRate, 1)}
        subtitle="% of sessions personalized"
        icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Personalized Conversion"
        value={formatPercentage(metrics.personalizedConversionRate, 1)}
        subtitle={`vs ${formatPercentage(metrics.nonPersonalizedConversionRate, 1)} without`}
        icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
        isLoading={isLoading}
      />
    </>
  );
}

