'use client';

import { useTranslations } from 'next-intl';
import { FunnelChart } from '@/components/Dashboard/FunnelChart/FunnelChart';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { usePerformanceData } from '@/hooks/useDashboardData';
import { formatDuration, formatPercentage } from '@/utils/formatters';

export default function PerformancePage() {
  const t = useTranslations('dashboard.performance');
  const { metrics, funnelData, stepMetrics, isLoading, error, refetch } = usePerformanceData();

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading performance data..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load performance data" onRetry={refetch} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={<RealtimeIndicator isActive={true} />}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('conversionRate')}
          value={formatPercentage(parseFloat(metrics.conversionRate))}
          subtitle="Overall checkout completion"
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgCheckoutTime')}
          value={formatDuration(metrics.avgCheckoutTime)}
          subtitle="Time to complete checkout"
          icon={<ClockIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('abandonmentRate')}
          value={formatPercentage(parseFloat(metrics.abandonmentRate))}
          subtitle="Checkouts abandoned"
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('totalSessions')}
          value={metrics.totalSessions?.toLocaleString() || '0'}
          subtitle="Checkout sessions started"
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Funnel Chart */}
      <div className="mb-8">
        <ChartCard title={t('funnelTitle')} subtitle={t('funnelSubtitle')}>
          <FunnelChart data={funnelData} />
        </ChartCard>
      </div>

      {/* Step Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stepMetrics.map((step) => (
          <ChartCard
            key={step.step}
            title={step.label}
            subtitle={`Average time: ${step.avgTime}s | Abandonment: ${step.abandonment}%`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Time</span>
                <span className="text-lg font-bold text-gray-900">
                  {step.avgTime}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Abandonment Rate</span>
                <span className="text-lg font-bold text-red-600">
                  {step.abandonment}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                  style={{ width: `${100 - step.abandonment}%` }}
                />
              </div>
            </div>
          </ChartCard>
        ))}
      </div>
    </PageWrapper>
  );
}

