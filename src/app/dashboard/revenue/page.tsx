'use client';

import { useTranslations } from 'next-intl';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { PeriodSelector } from '@/components/Dashboard/PeriodSelector/PeriodSelector';
import { ChartWrapper } from '@/components/Dashboard/ChartWrapper/ChartWrapper';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useRevenueData } from '@/hooks/useDashboardData';
import { useSafeRevenueMetrics } from '@/hooks/useSafeMetrics';
import { useRevenueChartData, useRevenueByHourData, useRevenueByDayData } from '@/hooks/useChartData';
import { usePeriod } from '@/contexts/PeriodContext';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export default function RevenuePage() {
  const t = useTranslations('dashboard.revenue');
  const { period, startDate, endDate } = usePeriod();
  const { metrics, chartData, revenueByHour, revenueByDay, isLoading, error, refetch } = useRevenueData({ period, startDate, endDate });

  // Normalize metrics using hooks
  const displayMetrics = useSafeRevenueMetrics(metrics);
  const displayRevenueData = useRevenueChartData(chartData);
  const displayRevenueByHour = useRevenueByHourData(revenueByHour);
  const displayRevenueByDay = useRevenueByDayData(revenueByDay);

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
          title={t('totalRevenue')}
          value={formatCurrency(displayMetrics.totalRevenue)}
          subtitle={t('subtitles.forSelectedPeriod')}
          trend={{
            value: displayMetrics.revenueGrowth,
            isPositive: displayMetrics.revenueGrowth > 0,
          }}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('avgOrderValue')}
          value={formatCurrency(displayMetrics.avgOrderValue)}
          subtitle={t('subtitles.averageTransactionValue')}
          icon={<ShoppingBagIcon className="w-6 h-6 text-white" />}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('totalOrders')}
          value={formatNumber(displayMetrics.totalOrders)}
          subtitle={t('subtitles.ordersProcessed')}
          icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('revenuePerHour')}
          value={formatCurrency(displayMetrics.revenuePerHour)}
          subtitle={t('subtitles.averageHourlyRevenue')}
          icon={<ClockIcon className="w-6 h-6 text-white" />}
          isLoading={isLoading}
        />
      </div>

      {/* Revenue Chart */}
      <div className="mb-8">
        <ChartCard 
          title={t('trendTitle')} 
          subtitle={t('trendSubtitle')}
          action={<PeriodSelector />}
        >
          <ChartWrapper
            data={displayRevenueData}
            type="line"
            dataKey="revenue"
            isLoading={isLoading}
            loadingMessage={t('messages.loading')}
            emptyMessage={t('charts.noData')}
            tooltipFormatter={(value: number) => [formatCurrency(value), t('charts.revenueTooltip')]}
          />
        </ChartCard>
      </div>

      {/* Additional Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title={t('charts.revenueByHour')} subtitle={t('charts.peakHoursAnalysis')}>
          <ChartWrapper
            data={displayRevenueByHour}
            type="bar"
            dataKey="revenue"
            xAxisKey="hour"
            isLoading={isLoading}
            loadingMessage={t('messages.loading')}
            emptyMessage={t('charts.noData')}
            xAxisProps={{ angle: -45, textAnchor: 'end', height: 80 }}
            tooltipFormatter={(value: number) => [formatCurrency(value), t('charts.revenueTooltip')]}
          />
        </ChartCard>
        <ChartCard title={t('charts.revenueByDay')} subtitle={t('charts.weeklyPattern')}>
          <ChartWrapper
            data={displayRevenueByDay}
            type="bar"
            dataKey="revenue"
            xAxisKey="day"
            isLoading={isLoading}
            loadingMessage={t('messages.loading')}
            emptyMessage={t('charts.noData')}
            xAxisProps={{ angle: -45, textAnchor: 'end', height: 80 }}
            tooltipFormatter={(value: number) => [formatCurrency(value), t('charts.revenueTooltip')]}
          />
        </ChartCard>
      </div>
    </PageWrapper>
  );
}

