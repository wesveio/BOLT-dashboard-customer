'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Select, SelectItem } from '@heroui/react';
import { ChartBarIcon, ExclamationTriangleIcon, ChartPieIcon, ClockIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PlanGuard } from '@/components/Dashboard/PlanGuard/PlanGuard';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import { RiskDistributionChart } from '@/components/Dashboard/RiskDistributionChart/RiskDistributionChart';
import { RiskTrendChart } from '@/components/Dashboard/RiskTrendChart/RiskTrendChart';
import { PredictionsTable } from '@/components/Dashboard/PredictionsTable/PredictionsTable';
import { ModelMetricsCard } from '@/components/Dashboard/ModelMetricsCard/ModelMetricsCard';
import { PredictionsHelpSection } from '@/components/Dashboard/PredictionsHelpSection/PredictionsHelpSection';
import { useAbandonmentPredictionsRealtime } from '@/hooks/useAbandonmentPredictionsRealtime';
import { useApi } from '@/hooks/useApi';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { periodOptions, getTranslatedPeriodOptions, type Period } from '@/utils/default-data';
import { usePeriod } from '@/contexts/PeriodContext';
import { CustomPeriodSelector } from '@/components/Dashboard/CustomPeriodSelector/CustomPeriodSelector';
import type { ModelMetrics } from '@/lib/ai/models/abandonment-predictor';

export default function PredictionsPage() {
  const t = useTranslations('dashboard.boltx');
  const tPeriods = useTranslations('dashboard.common.periods');
  const { period, setPeriod, startDate, endDate } = usePeriod();

  // Fetch real-time predictions data
  const {
    activeSessions,
    historicalSessions,
    summary,
    isLoading: isLoadingPredictions,
    error: predictionsError,
    lastUpdated,
  } = useAbandonmentPredictionsRealtime({
    period,
    startDate,
    endDate,
    pollingInterval: 10000, // 10 seconds
    enabled: true,
  });

  // Fetch model metrics
  const { data: modelMetrics, isLoading: isLoadingMetrics } = useApi<ModelMetrics>(
    '/api/boltx/model-metrics',
    {
      cacheKey: 'model_metrics',
      cacheTTL: 1, // 1 minute cache
      refetchOnMount: true,
    }
  );

  // Combine active and historical for charts
  const allPredictions = useMemo(() => {
    return [...activeSessions, ...historicalSessions];
  }, [activeSessions, historicalSessions]);

  // High risk sessions (high or critical)
  const highRiskSessions = useMemo(() => {
    return allPredictions.filter(
      (p) => p.prediction.riskLevel === 'high' || p.prediction.riskLevel === 'critical'
    );
  }, [allPredictions]);

  const isLoading = isLoadingPredictions || isLoadingMetrics;
  const error = predictionsError;

  if (error) {
    return (
      <PlanGuard requiredPlan="enterprise">
        <PageWrapper>
          <PageHeader
            title={t('predictions.title')}
            description={t('predictions.description')}
            icon={ChartBarIcon}
          />
          <ErrorState
            message={t('predictions.errors.loadFailed') || 'Failed to load predictions'}
            onRetry={() => window.location.reload()}
          />
        </PageWrapper>
      </PlanGuard>
    );
  }

  return (
    <PlanGuard requiredPlan="enterprise">
      <PageWrapper>
        <PageHeader
          title={t('predictions.title')}
          description={t('predictions.description')}
          icon={ChartBarIcon}
          action={
            <div className="flex items-center gap-4">
              <RealtimeIndicator isActive={!!lastUpdated} />
              <Select
                size="sm"
                selectedKeys={[period]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as Period;
                  setPeriod(selected);
                }}
                className="w-40"
              >
                {getTranslatedPeriodOptions(tPeriods).map((option) => (
                  <SelectItem key={option.value} textValue={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          }
        />

        {/* Custom Period Selector */}
        {period === 'custom' && (
          <div className="mb-6">
            <CustomPeriodSelector />
          </div>
        )}

        {/* Help Section */}
        <PredictionsHelpSection />

        {isLoading && !summary ? (
          <LoadingState message={t('predictions.loading') || 'Loading predictions...'} />
        ) : (
          <>
            {/* First Row: Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <MetricCard
                title={t('predictions.metrics.totalSessions') || 'Total Sessions'}
                value={formatNumber(summary.totalSessions)}
                subtitle={t('predictions.metrics.subtitles.totalSessions') || 'All sessions in period'}
                icon={<ChartBarIcon className="w-6 h-6 text-white" />}
                isLoading={isLoading}
              />
              <MetricCard
                title={t('predictions.metrics.highRiskSessions') || 'High Risk Sessions'}
                value={formatNumber(highRiskSessions.length)}
                subtitle={t('predictions.metrics.subtitles.highRiskSessions') || 'Sessions at high or critical risk'}
                icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
                isLoading={isLoading}
              />
              <MetricCard
                title={t('predictions.metrics.avgRiskScore') || 'Avg Risk Score'}
                value={formatNumber(summary.avgRiskScore, { maximumFractionDigits: 1 })}
                subtitle={t('predictions.metrics.subtitles.avgRiskScore') || 'Average risk across all sessions'}
                icon={<ChartPieIcon className="w-6 h-6 text-white" />}
                isLoading={isLoading}
              />
              <MetricCard
                title={t('predictions.metrics.modelAccuracy') || 'Model Accuracy'}
                value={modelMetrics ? formatPercentage(modelMetrics.accuracy * 100) : 'N/A'}
                subtitle={t('predictions.metrics.subtitles.modelAccuracy') || 'Prediction model accuracy'}
                icon={<ClockIcon className="w-6 h-6 text-white" />}
                isLoading={isLoadingMetrics}
              />
            </div>

            {/* Second Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard
                title={t('predictions.charts.distributionTitle') || 'Risk Distribution'}
                subtitle={t('predictions.charts.distributionSubtitle') || 'Sessions by risk level'}
              >
                <RiskDistributionChart data={summary.riskDistribution} />
              </ChartCard>
              <ChartCard
                title={t('predictions.charts.trendTitle') || 'Risk Trend'}
                subtitle={t('predictions.charts.trendSubtitle') || 'Average risk score over time'}
              >
                <RiskTrendChart predictions={allPredictions} period={period} />
              </ChartCard>
            </div>

            {/* Third Row: Model Metrics */}
            <div className="mb-8">
              <ModelMetricsCard metrics={modelMetrics} isLoading={isLoadingMetrics} />
            </div>

            {/* Fourth Row: Predictions Table */}
            <div className="mb-8">
              <ChartCard
                title={t('predictions.table.title') || 'High Risk Sessions'}
                subtitle={t('predictions.table.subtitle') || 'Sessions with high or critical abandonment risk'}
              >
                <PredictionsTable
                  predictions={highRiskSessions.slice(0, 100)}
                  isLoading={isLoading}
                  maxRows={100}
                />
              </ChartCard>
        </div>
          </>
        )}
      </PageWrapper>
    </PlanGuard>
  );
}
