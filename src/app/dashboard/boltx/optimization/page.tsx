'use client';

import { useTranslations } from 'next-intl';
import { Select, SelectItem } from '@heroui/react';
import { PaintBrushIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PlanGuard } from '@/components/Dashboard/PlanGuard/PlanGuard';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import { FormOptimizationMetricsCard } from '@/components/Dashboard/FormOptimizationMetricsCard/FormOptimizationMetricsCard';
import { FieldPerformanceChart } from '@/components/Dashboard/FieldPerformanceChart/FieldPerformanceChart';
import { OptimizationEffectivenessChart } from '@/components/Dashboard/OptimizationEffectivenessChart/OptimizationEffectivenessChart';
import { FieldPerformanceTrendChart } from '@/components/Dashboard/FieldPerformanceTrendChart/FieldPerformanceTrendChart';
import { FormOptimizationConfig } from '@/components/Dashboard/FormOptimizationConfig/FormOptimizationConfig';
import { FieldsPerformanceTable } from '@/components/Dashboard/FieldsPerformanceTable/FieldsPerformanceTable';
import { OptimizationHelpSection } from '@/components/Dashboard/OptimizationHelpSection/OptimizationHelpSection';
import { useFormOptimizationMetrics } from '@/hooks/useFormOptimizationMetrics';
import { getTranslatedPeriodOptions } from '@/utils/default-data';
import { usePeriod } from '@/contexts/PeriodContext';
import { CustomPeriodSelector } from '@/components/Dashboard/CustomPeriodSelector/CustomPeriodSelector';

export default function OptimizationPage() {
  const t = useTranslations('dashboard.boltx');
  const tPeriods = useTranslations('dashboard.common.periods');
  const { period, setPeriod, startDate, endDate } = usePeriod();

  // Fetch metrics
  const {
    metrics,
    isLoading,
    error,
    refetch: refetchMetrics,
  } = useFormOptimizationMetrics({
    period,
    startDate,
    endDate,
    enabled: true,
  });

  const handleConfigSave = () => {
    // Refetch data after config save
    refetchMetrics();
  };

  if (error) {
    return (
      <PlanGuard requiredPlan="enterprise">
        <PageWrapper>
          <PageHeader
            title={t('optimization.title')}
            description={t('optimization.description')}
            icon={PaintBrushIcon}
          />
          <ErrorState
            message={t('optimization.errors.loadFailed') || 'Failed to load form optimization data'}
            onRetry={() => {
              refetchMetrics();
            }}
          />
        </PageWrapper>
      </PlanGuard>
    );
  }

  return (
    <PlanGuard requiredPlan="enterprise">
      <PageWrapper>
        <PageHeader
          title={t('optimization.title')}
          description={t('optimization.description')}
          icon={PaintBrushIcon}
          action={
            <div className="flex items-center gap-4">
              <RealtimeIndicator isActive={true} />
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
        <OptimizationHelpSection />

        {isLoading && !metrics ? (
          <LoadingState message={t('optimization.loading') || 'Loading form optimization data...'} />
        ) : (
          <>
            {/* First Row: Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <FormOptimizationMetricsCard metrics={metrics} isLoading={isLoading} />
            </div>

            {/* Second Row: Effectiveness Chart */}
            <div className="mb-8">
              <ChartCard
                title={t('optimization.charts.effectivenessTitle') || 'Optimization Effectiveness'}
                subtitle={t('optimization.charts.effectivenessSubtitle') || 'Conversion rate with vs without optimization'}
              >
                <OptimizationEffectivenessChart
                  optimizedConversionRate={metrics.optimizedConversionRate}
                  nonOptimizedConversionRate={metrics.nonOptimizedConversionRate}
                  byStep={metrics.byStep}
                />
              </ChartCard>
            </div>

            {/* Third Row: Field Performance and Trend Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard
                title={t('optimization.charts.fieldPerformanceTitle') || 'Field Performance'}
                subtitle={t('optimization.charts.fieldPerformanceSubtitle') || 'Performance metrics by field'}
              >
                <FieldPerformanceChart fields={metrics.byField} />
              </ChartCard>
              <ChartCard
                title={t('optimization.charts.trendTitle') || 'Performance Trend'}
                subtitle={t('optimization.charts.trendSubtitle') || 'Field performance over time'}
              >
                <FieldPerformanceTrendChart trend={metrics.trend} period={period} />
              </ChartCard>
            </div>

            {/* Fourth Row: Configuration and Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <FormOptimizationConfig onSave={handleConfigSave} fields={metrics.byField} />
              <ChartCard
                title={t('optimization.metrics.title') || 'Step Metrics'}
                subtitle={t('optimization.metrics.subtitle') || 'Performance by checkout step'}
              >
                <div className="space-y-4">
                  {Object.entries(metrics.byStep).map(([step, stepData]) => (
                    <div key={step} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 capitalize">{step}</h4>
                        <span className="text-sm text-gray-600">
                          {stepData.optimizedConversionRate.toFixed(1)}% optimized
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Fields:</span>
                          <span className="ml-2 font-semibold text-gray-900">{stepData.totalFields}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Completion Rate:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {(stepData.avgCompletionRate * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Error Rate:</span>
                          <span className="ml-2 font-semibold text-red-600">
                            {(stepData.avgErrorRate * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Time:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {(stepData.avgTimeToComplete / 1000).toFixed(2)}s
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(metrics.byStep).length === 0 && (
                    <p className="text-gray-500 text-center py-8">No step metrics available</p>
                  )}
                </div>
              </ChartCard>
            </div>

            {/* Fifth Row: Fields Performance Table */}
            <div className="mb-8">
              <ChartCard
                title={t('optimization.table.title') || 'Field Performance Details'}
                subtitle={t('optimization.table.subtitle') || 'Detailed performance metrics for all fields'}
              >
                <FieldsPerformanceTable
                  fields={metrics.byField}
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
