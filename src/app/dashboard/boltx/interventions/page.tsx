'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Select, SelectItem } from '@heroui/react';
import { BoltIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PlanGuard } from '@/components/Dashboard/PlanGuard/PlanGuard';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import { InterventionMetricsCard } from '@/components/Dashboard/InterventionMetricsCard/InterventionMetricsCard';
import { InterventionEffectivenessChart } from '@/components/Dashboard/InterventionEffectivenessChart/InterventionEffectivenessChart';
import { InterventionConfig } from '@/components/Dashboard/InterventionConfig/InterventionConfig';
import { InterventionsTable } from '@/components/Dashboard/InterventionsTable/InterventionsTable';
import { InterventionsHelpSection } from '@/components/Dashboard/InterventionsHelpSection/InterventionsHelpSection';
import { useInterventionsData } from '@/hooks/useInterventionsData';
import { useInterventionMetrics } from '@/hooks/useInterventionMetrics';
import { getTranslatedPeriodOptions, type Period } from '@/utils/default-data';

export default function InterventionsPage() {
  const t = useTranslations('dashboard.boltx');
  const tPeriods = useTranslations('dashboard.common.periods');
  const [period, setPeriod] = useState<Period>('week');

  // Fetch interventions data
  const {
    interventions,
    isLoading: isLoadingInterventions,
    error: interventionsError,
    refetch: refetchInterventions,
  } = useInterventionsData({
    period,
    enabled: true,
  });

  // Fetch metrics
  const {
    metrics,
    isLoading: isLoadingMetrics,
    error: metricsError,
    refetch: refetchMetrics,
  } = useInterventionMetrics({
    period,
    enabled: true,
  });

  const isLoading = isLoadingInterventions || isLoadingMetrics;
  const error = interventionsError || metricsError;

  // Debug: Log metrics to console
  if (typeof window !== 'undefined' && metrics) {
    console.log('🔍 [DEBUG] Interventions metrics in component:', {
      totalInterventions: metrics.totalInterventions,
      withInterventionRate: metrics.withInterventionRate,
      withoutInterventionRate: metrics.withoutInterventionRate,
      byType: metrics.byType,
    });
  }

  const handleConfigSave = () => {
    // Refetch data after config save
    refetchInterventions();
    refetchMetrics();
  };

  if (error) {
    return (
      <PlanGuard requiredPlan="enterprise">
        <PageWrapper>
          <PageHeader
            title={t('interventions.title')}
            description={t('interventions.description')}
            icon={BoltIcon}
          />
          <ErrorState
            message={t('interventions.errors.loadFailed') || 'Failed to load interventions'}
            onRetry={() => {
              refetchInterventions();
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
          title={t('interventions.title')}
          description={t('interventions.description')}
          icon={BoltIcon}
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

        {/* Help Section */}
        <InterventionsHelpSection />

        {isLoading && !metrics ? (
          <LoadingState message={t('interventions.loading') || 'Loading interventions...'} />
        ) : (
          <>
            {/* First Row: Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <InterventionMetricsCard metrics={metrics} isLoading={isLoading} />
            </div>

            {/* Second Row: Effectiveness Chart */}
            <div className="mb-8">
              <ChartCard
                title={t('interventions.charts.effectivenessTitle') || 'Intervention Effectiveness'}
                subtitle={t('interventions.charts.effectivenessSubtitle') || 'Conversion rate by intervention type'}
              >
                <InterventionEffectivenessChart
                  byType={metrics.byType}
                  withInterventionRate={metrics.withInterventionRate}
                  withoutInterventionRate={metrics.withoutInterventionRate}
                />
              </ChartCard>
            </div>

            {/* Third Row: Configuration and Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <InterventionConfig onSave={handleConfigSave} />
              <ChartCard
                title={t('interventions.metrics.title') || 'Detailed Metrics'}
                subtitle={t('interventions.metrics.subtitle') || 'Breakdown by intervention type'}
              >
                <div className="space-y-4">
                  {Object.entries(metrics.byType).map(([type, data]) => (
                    <div key={type} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 capitalize">{type}</h4>
                        <span className="text-sm text-gray-600">
                          {data.conversionRate.toFixed(1)}% conversion
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Applied:</span>
                          <span className="ml-2 font-semibold text-gray-900">{data.applied}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Converted:</span>
                          <span className="ml-2 font-semibold text-green-600">{data.converted}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Abandoned:</span>
                          <span className="ml-2 font-semibold text-red-600">{data.abandoned}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(metrics.byType).length === 0 && (
                    <p className="text-gray-500 text-center py-8">No intervention data available</p>
                  )}
                </div>
              </ChartCard>
            </div>

            {/* Fourth Row: Interventions Table */}
            <div className="mb-8">
              <ChartCard
                title={t('interventions.table.title') || 'Recent Interventions'}
                subtitle={t('interventions.table.subtitle') || 'List of interventions applied in the selected period'}
              >
                <InterventionsTable
                  interventions={interventions}
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
