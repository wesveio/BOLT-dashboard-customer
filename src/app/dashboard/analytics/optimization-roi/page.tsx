'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { Select, SelectItem, Input, Chip, Card, CardBody } from '@heroui/react';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useOptimizationROIData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { getTranslatedPeriodOptions, type Period } from '@/utils/default-data';
import { usePeriod } from '@/contexts/PeriodContext';

export default function OptimizationROIPage() {
  const t = useTranslations('dashboard.analytics.optimizationROI');
  const tPeriods = useTranslations('dashboard.common.periods');
  const { period, setPeriod, startDate, endDate } = usePeriod();
  const [optimizationDate, setOptimizationDate] = useState<string>('');
  const { summary, isLoading, error, refetch, optimizationDate: apiOptimizationDate } = useOptimizationROIData({
    period,
    startDate,
    endDate,
    optimizationDate: optimizationDate || undefined,
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message={t('loading')} fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message={t('failedToLoad')} onRetry={refetch} />
      </PageWrapper>
    );
  }

  const isPositive = summary.changes.revenueChange > 0;
  const isROIPositive = summary.roi.roi > 0;

  return (
    <PageWrapper>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <div className="flex gap-4">
            <Input
              type="date"
              label={t('optimizationDate')}
              value={optimizationDate || (apiOptimizationDate ? apiOptimizationDate.split('T')[0] : '')}
              onValueChange={(value) => setOptimizationDate(value)}
              className="w-48"
              size="sm"
            />
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

      {/* ROI Summary */}
      <div className="mb-8">
        <Card className="border border-default">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('roiSummary')}</h3>
                <p className="text-sm text-foreground/70">
                  {t('optimizationDate')}: {apiOptimizationDate ? new Date(apiOptimizationDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-foreground">{t('roi')}</span>
                  <Chip
                    color={isROIPositive ? 'success' : 'danger'}
                    variant="flat"
                    size="lg"
                  >
                    {summary.roi.roiFormatted}
                  </Chip>
                </div>
                <p className="text-sm text-foreground/70">
                  {t('additionalRevenue')}: {formatCurrency(summary.changes.additionalRevenue)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('revenueChange')}
          value={formatCurrency(summary.changes.revenueChange)}
          subtitle={
            summary.changes.revenueChangePercent !== null
              ? `${formatPercentage(Math.abs(summary.changes.revenueChangePercent))} ${isPositive ? t('increase') : t('decrease')}`
              : t('noBaseline')
          }
          icon={
            isPositive ? (
              <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
            ) : (
              <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
            )
          }
        />
        <MetricCard
          title={t('conversionRateChange')}
          value={formatPercentage(Math.abs(summary.changes.conversionRateChange))}
          subtitle={
            summary.changes.conversionRateChangePercent !== null
              ? `${summary.changes.conversionRateChangePercent >= 0 ? '+' : ''}${formatPercentage(summary.changes.conversionRateChangePercent)}`
              : t('noBaseline')
          }
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('additionalOrders')}
          value={formatNumber(summary.changes.additionalOrders)}
          subtitle={t('ordersGained')}
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('aovChange')}
          value={formatCurrency(summary.changes.aovChange)}
          subtitle={
            summary.changes.aovChangePercent !== null
              ? `${formatPercentage(Math.abs(summary.changes.aovChangePercent))} ${t('change')}`
              : t('noBaseline')
          }
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title={t('beforePeriod')}
          subtitle={`${new Date(summary.beforePeriod.start).toLocaleDateString()} - ${new Date(summary.beforePeriod.end).toLocaleDateString()}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('sessions')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatNumber(summary.beforePeriod.sessions)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('conversions')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatNumber(summary.beforePeriod.conversions)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('conversionRate')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatPercentage(summary.beforePeriod.conversionRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('revenue')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(summary.beforePeriod.revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('orders')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatNumber(summary.beforePeriod.orders)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('aov')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(summary.beforePeriod.aov)}
              </span>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title={t('afterPeriod')}
          subtitle={`${new Date(summary.afterPeriod.start).toLocaleDateString()} - ${new Date(summary.afterPeriod.end).toLocaleDateString()}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('sessions')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatNumber(summary.afterPeriod.sessions)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('conversions')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatNumber(summary.afterPeriod.conversions)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('conversionRate')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatPercentage(summary.afterPeriod.conversionRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('revenue')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(summary.afterPeriod.revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('orders')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatNumber(summary.afterPeriod.orders)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{t('aov')}</span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(summary.afterPeriod.aov)}
              </span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Changes Summary */}
      <ChartCard
        title={t('impactSummaryTitle')}
        subtitle={t('impactSummarySubtitle')}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-foreground/70 mb-2">{t('revenueImpact')}</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{formatCurrency(summary.changes.revenueChange)}
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              {summary.changes.revenueChangePercent !== null
                ? `${formatPercentage(Math.abs(summary.changes.revenueChangePercent))} ${t('change')}`
                : t('noBaseline')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground/70 mb-2">{t('conversionImpact')}</p>
            <p className={`text-2xl font-bold ${
              summary.changes.conversionRateChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.changes.conversionRateChange >= 0 ? '+' : ''}
              {formatPercentage(summary.changes.conversionRateChange)} {t('pp')}
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              {summary.changes.conversionRateChangePercent !== null
                ? `${formatPercentage(Math.abs(summary.changes.conversionRateChangePercent))} ${t('change')}`
                : t('noBaseline')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground/70 mb-2">{t('additionalOrdersMetric')}</p>
            <p className={`text-2xl font-bold ${
              summary.changes.additionalOrders >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.changes.additionalOrders >= 0 ? '+' : ''}{formatNumber(summary.changes.additionalOrders)}
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              {formatCurrency(summary.changes.additionalRevenue)} {t('additionalRevenueLabel')}
            </p>
          </div>
        </div>
      </ChartCard>
    </PageWrapper>
  );
}

