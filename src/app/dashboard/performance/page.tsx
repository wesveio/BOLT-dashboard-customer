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
import { usePeriod } from '@/contexts/PeriodContext';
import { formatDuration, formatPercentage } from '@/utils/formatters';

export default function PerformancePage() {
  const t = useTranslations('dashboard.performance');
  const { period, startDate, endDate } = usePeriod();
  const { metrics, funnelData, stepMetrics, isLoading, error, refetch } = usePerformanceData({ period, startDate, endDate });

  // Ensure all metrics are non-negative before displaying
  const safeMetrics = {
    conversionRate: Math.max(0, parseFloat(metrics.conversionRate) || 0),
    avgCheckoutTime: Math.max(0, metrics.avgCheckoutTime || 0),
    abandonmentRate: Math.max(0, parseFloat(metrics.abandonmentRate) || 0),
    totalSessions: Math.max(0, metrics.totalSessions || 0),
  };

  // Ensure step metrics have non-negative times
  const safeStepMetrics = stepMetrics.map(step => ({
    ...step,
    avgTime: Math.max(0, step.avgTime || 0),
    abandonment: Math.max(0, Math.min(100, step.abandonment || 0)),
  }));

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message={t('messages.loading')} fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message={t('messages.failedToLoad')} onRetry={refetch} />
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
          value={formatPercentage(safeMetrics.conversionRate)}
          subtitle={t('subtitles.overallCompletion')}
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgCheckoutTime')}
          value={formatDuration(safeMetrics.avgCheckoutTime)}
          subtitle={t('subtitles.timeToComplete')}
          icon={<ClockIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('abandonmentRate')}
          value={formatPercentage(safeMetrics.abandonmentRate)}
          subtitle={t('subtitles.checkoutsAbandoned')}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('totalSessions')}
          value={safeMetrics.totalSessions.toLocaleString()}
          subtitle={t('subtitles.sessionsStarted')}
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
        {safeStepMetrics.map((step) => {
          const clampedAbandonment = Math.max(0, Math.min(100, step.abandonment));
          const progressWidth = Math.max(0, Math.min(100, 100 - clampedAbandonment));
          const formattedAbandonment = formatPercentage(clampedAbandonment, 1);
          const safeAvgTime = Math.max(0, step.avgTime);

          return (
            <ChartCard
              key={step.step}
              title={step.label}
              subtitle={`Average time: ${safeAvgTime}s | Abandonment: ${formattedAbandonment}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('labels.averageTime')}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {safeAvgTime}s
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('labels.abandonmentRate')}</span>
                  <span className="text-lg font-bold text-red-600">
                    {formattedAbandonment}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-200"
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>
            </ChartCard>
          );
        })}
      </div>
    </PageWrapper>
  );
}

