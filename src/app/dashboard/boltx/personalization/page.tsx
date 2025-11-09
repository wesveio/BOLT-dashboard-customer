'use client';

import { useTranslations } from 'next-intl';
import { Select, SelectItem } from '@heroui/react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { PlanGuard } from '@/components/Dashboard/PlanGuard/PlanGuard';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import { PersonalizationMetricsCard } from '@/components/Dashboard/PersonalizationMetricsCard/PersonalizationMetricsCard';
import { DeviceDistributionChart } from '@/components/Dashboard/DeviceDistributionChart/DeviceDistributionChart';
import { ProfilesTrendChart } from '@/components/Dashboard/ProfilesTrendChart/ProfilesTrendChart';
import { PersonalizationConversionChart } from '@/components/Dashboard/PersonalizationConversionChart/PersonalizationConversionChart';
import { ProfilesTable } from '@/components/Dashboard/ProfilesTable/ProfilesTable';
import { PersonalizationConfig } from '@/components/Dashboard/PersonalizationConfig/PersonalizationConfig';
import { PersonalizationRules } from '@/components/Dashboard/PersonalizationRules/PersonalizationRules';
import { PersonalizationHelpSection } from '@/components/Dashboard/PersonalizationHelpSection/PersonalizationHelpSection';
import { usePersonalizationProfiles } from '@/hooks/usePersonalizationProfiles';
import { usePersonalizationMetrics } from '@/hooks/usePersonalizationMetrics';
import { getTranslatedPeriodOptions, type Period } from '@/utils/default-data';
import { usePeriod } from '@/contexts/PeriodContext';
import { CustomPeriodSelector } from '@/components/Dashboard/CustomPeriodSelector/CustomPeriodSelector';

export default function PersonalizationPage() {
  const t = useTranslations('dashboard.boltx');
  const tPeriods = useTranslations('dashboard.common.periods');
  const { period, setPeriod, startDate, endDate } = usePeriod();

  // Fetch profiles data
  const {
    profiles,
    deviceDistribution,
    isLoading: isLoadingProfiles,
    error: profilesError,
    refetch: refetchProfiles,
    lastUpdated,
  } = usePersonalizationProfiles({
    period,
    startDate,
    endDate,
    enabled: true,
  });

  // Fetch metrics
  const {
    metrics,
    isLoading: isLoadingMetrics,
    error: metricsError,
    refetch: refetchMetrics,
  } = usePersonalizationMetrics({
    period,
    startDate,
    endDate,
    enabled: true,
  });

  const isLoading = isLoadingProfiles || isLoadingMetrics;
  const error = profilesError || metricsError;

  const handleConfigSave = () => {
    // Refetch data after config save
    refetchProfiles();
    refetchMetrics();
  };

  if (error) {
    return (
      <PlanGuard requiredPlan="enterprise">
        <PageWrapper>
          <PageHeader
            title={t('personalization.title')}
            description={t('personalization.description')}
            icon={LightBulbIcon}
          />
          <ErrorState
            message={t('personalization.errors.loadFailed') || 'Failed to load personalization data'}
            onRetry={() => {
              refetchProfiles();
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
          title={t('personalization.title')}
          description={t('personalization.description')}
          icon={LightBulbIcon}
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
        <PersonalizationHelpSection />

        {isLoading && !metrics ? (
          <LoadingState message={t('personalization.loading') || 'Loading personalization data...'} />
        ) : (
          <>
            {/* First Row: Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <PersonalizationMetricsCard metrics={metrics} isLoading={isLoading} />
            </div>

            {/* Second Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard
                title={t('personalization.charts.deviceDistributionTitle') || 'Device Distribution'}
                subtitle={t('personalization.charts.deviceDistributionSubtitle') || 'Profiles by device type'}
              >
                <DeviceDistributionChart data={deviceDistribution} />
              </ChartCard>
              <ChartCard
                title={t('personalization.charts.conversionTitle') || 'Conversion by Device'}
                subtitle={t('personalization.charts.conversionSubtitle') || 'Personalized vs non-personalized'}
              >
                <PersonalizationConversionChart
                  conversionByDevice={metrics.conversionByDevice}
                  personalizedConversionRate={metrics.personalizedConversionRate}
                  nonPersonalizedConversionRate={metrics.nonPersonalizedConversionRate}
                />
              </ChartCard>
            </div>

            {/* Third Row: Trend Chart */}
            <div className="mb-8">
              <ChartCard
                title={t('personalization.charts.trendTitle') || 'Profiles Trend'}
                subtitle={t('personalization.charts.trendSubtitle') || 'Creation and updates over time'}
              >
                <ProfilesTrendChart profiles={profiles} period={period} />
              </ChartCard>
            </div>

            {/* Fourth Row: Configuration and Rules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <PersonalizationConfig onSave={handleConfigSave} />
              <PersonalizationRules />
            </div>

            {/* Fifth Row: Profiles Table */}
            <div className="mb-8">
              <ChartCard
                title={t('personalization.table.title') || 'User Profiles'}
                subtitle={t('personalization.table.subtitle') || 'List of user profiles in the selected period'}
              >
                <ProfilesTable
                  profiles={profiles}
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
