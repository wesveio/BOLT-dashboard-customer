'use client';

import { useTranslations } from 'next-intl';
import { FunnelChart } from '@/components/Dashboard/FunnelChart/FunnelChart';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PageStateHandler } from '@/components/Dashboard/PageStateHandler/PageStateHandler';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { usePerformanceData } from '@/hooks/useDashboardData';
import { useSafePerformanceMetrics, useSafeStepMetrics } from '@/hooks/useSafeMetrics';
import { usePeriod } from '@/contexts/PeriodContext';
import { formatDuration, formatPercentage, formatCompactNumber } from '@/utils/formatters';
import { clampValue } from '@/utils/data-validation';

export default function PerformancePage() {
  const t = useTranslations('dashboard.performance');
  const { period, startDate, endDate } = usePeriod();
  const { metrics, funnelData, stepMetrics, isLoading, error, refetch } = usePerformanceData({ period, startDate, endDate });

  // Normalize metrics using hooks
  const safeMetrics = useSafePerformanceMetrics(metrics);
  const safeStepMetrics = useSafeStepMetrics(stepMetrics);

  return (
    <PageStateHandler
      isLoading={isLoading}
      error={error ? new Error(error.message || 'Unknown error') : null}
      onRetry={refetch}
      title={t('title')}
      subtitle={t('subtitle')}
      loadingMessage={t('messages.loading')}
      errorMessage={t('messages.failedToLoad')}
    >
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
          value={formatCompactNumber(safeMetrics.totalSessions, { threshold: 1_000_000 })}
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
          const clampedAbandonment = clampValue(step.abandonment, 0, 100);
          const progressWidth = clampValue(100 - clampedAbandonment, 0, 100);
          const formattedAbandonment = formatPercentage(clampedAbandonment);
          const safeAvgTime = step.avgTime;

          return (
            <ChartCard
              key={step.step}
              title={step.label}
              subtitle={`Average time: ${safeAvgTime}s | Abandonment: ${formattedAbandonment}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">{t('labels.averageTime')}</span>
                  <span className="text-lg font-bold text-foreground">
                    {safeAvgTime}s
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/70">{t('labels.abandonmentRate')}</span>
                  <span className="text-lg font-bold text-red-600">
                    {formattedAbandonment}
                  </span>
                </div>
                <div className="h-2 bg-default-100 rounded-full overflow-hidden">
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
    </PageStateHandler>
  );
}

