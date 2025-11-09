'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardBody, Button } from '@heroui/react';
import Link from 'next/link';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  XCircleIcon,
  LightBulbIcon,
  ArrowRightIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { PeriodSelector } from '@/components/Dashboard/PeriodSelector/PeriodSelector';
import { QuickLinkCard } from '@/components/Dashboard/QuickLinkCard/QuickLinkCard';
import { InsightCard } from '@/components/Dashboard/InsightCard/InsightCard';
import { ChartWrapper } from '@/components/Dashboard/ChartWrapper/ChartWrapper';
import { useMetricsData, useRevenueData, usePerformanceData } from '@/hooks/useDashboardData';
import { useApi } from '@/hooks/useApi';
import { useSafeRevenueMetrics } from '@/hooks/useSafeMetrics';
import { useRevenueChartData } from '@/hooks/useChartData';
import { formatCurrency, formatNumber, formatPercentage, formatDuration } from '@/utils/formatters';
import { usePeriod } from '@/contexts/PeriodContext';
import { CustomPeriodSelector } from '@/components/Dashboard/CustomPeriodSelector/CustomPeriodSelector';
import type { Insight } from '@/app/dashboard/insights/page';

export default function DashboardPage() {
  const tOverview = useTranslations('dashboard.overview');
  const { isLoading: isLoadingAuth } = useDashboardAuth();
  const { period, startDate, endDate } = usePeriod();
  
  // Fetch all data in parallel
  const { metrics, isLoading: isLoadingMetrics, error: metricsError, refetch: refetchMetrics } = useMetricsData({ period, startDate, endDate });
  const { metrics: revenueMetrics, chartData, isLoading: isLoadingRevenue } = useRevenueData({ period, startDate, endDate });
  const { metrics: performanceMetrics, isLoading: isLoadingPerformance } = usePerformanceData({ period, startDate, endDate });
  const { data: insightsData } = useApi<{ insights: Insight[] }>('/api/dashboard/insights', {
    cacheKey: 'insights',
    cacheTTL: 5,
  });

  // Normalize revenue metrics
  const safeRevenueMetrics = useSafeRevenueMetrics(revenueMetrics);

  // Calculate trends from revenue growth
  const revenueGrowth = useMemo(() => {
    return safeRevenueMetrics.revenueGrowth;
  }, [safeRevenueMetrics.revenueGrowth]);

  // Top 3 high-impact insights
  const topInsights = useMemo(() => {
    const insights = insightsData?.insights || [];
    return insights
      .filter((i) => i.impact === 'high')
      .slice(0, 3);
  }, [insightsData]);

  // Prepare revenue chart data using hook
  const displayRevenueChartData = useRevenueChartData(chartData);

  const isLoading = isLoadingMetrics || isLoadingRevenue || isLoadingPerformance;
  const error = metricsError;

  return (
    <PageWrapper>
      <PageHeader
        title={tOverview('title')}
        subtitle={tOverview('welcome')}
        action={<PeriodSelector />}
      />

      {/* Custom Period Selector */}
      {period === 'custom' && (
        <div className="mb-6">
          <CustomPeriodSelector />
        </div>
      )}

      {/* User Info Card */}
      {isLoadingAuth && (
        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 mb-8">
          <CardBody className="p-6">
            <LoadingState fullScreen={false} />
          </CardBody>
        </Card>
      )}

      {/* Metrics Cards */}
      {error ? (
        <ErrorState message={tOverview('messages.failedToLoad')} onRetry={refetchMetrics} />
      ) : (
        <>
          {/* First Row: Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title={tOverview('totalRevenue')}
              value={formatCurrency(metrics.totalRevenue)}
              subtitle={tOverview('subtitles.totalRevenue')}
              trend={{
                value: revenueGrowth,
                isPositive: revenueGrowth > 0,
              }}
              icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
              isLoading={isLoading}
            />
            <MetricCard
              title={tOverview('totalOrders')}
              value={formatNumber(metrics.totalOrders)}
              subtitle={tOverview('subtitles.totalOrders')}
              icon={<ShoppingBagIcon className="w-6 h-6 text-white" />}
              isLoading={isLoading}
            />
            <MetricCard
              title={tOverview('conversionRate')}
              value={formatPercentage(metrics.conversionRate)}
              subtitle={tOverview('subtitles.conversionRate')}
              icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
              isLoading={isLoading}
            />
            <MetricCard
              title={tOverview('totalSessions')}
              value={metrics.totalSessions.toLocaleString()}
              subtitle={tOverview('subtitles.totalSessions')}
              icon={<ChartBarIcon className="w-6 h-6 text-white" />}
              isLoading={isLoading}
            />
          </div>

          {/* Second Row: Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title={tOverview('avgOrderValue')}
              value={formatCurrency(safeRevenueMetrics.avgOrderValue)}
              subtitle={tOverview('subtitles.avgOrderValue')}
              icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
              isLoading={isLoadingRevenue}
            />
            <MetricCard
              title={tOverview('abandonmentRate')}
              value={formatPercentage(
                typeof performanceMetrics.abandonmentRate === 'string'
                  ? parseFloat(performanceMetrics.abandonmentRate)
                  : parseFloat(String(performanceMetrics.abandonmentRate || '0'))
              )}
              subtitle={tOverview('subtitles.abandonmentRate')}
              icon={<XCircleIcon className="w-6 h-6 text-white" />}
              isLoading={isLoadingPerformance}
            />
            <MetricCard
              title={tOverview('avgCheckoutTime')}
              value={formatDuration(performanceMetrics.avgCheckoutTime || 0)}
              subtitle={tOverview('subtitles.avgCheckoutTime')}
              icon={<ClockIcon className="w-6 h-6 text-white" />}
              isLoading={isLoadingPerformance}
            />
            <MetricCard
              title={tOverview('revenueGrowth')}
              value={formatPercentage(revenueGrowth)}
              subtitle={tOverview('subtitles.revenueGrowth')}
              trend={{
                value: revenueGrowth,
                isPositive: revenueGrowth > 0,
              }}
              icon={<ChartBarIcon className="w-6 h-6 text-white" />}
              isLoading={isLoadingRevenue}
            />
          </div>
        </>
      )}

      {/* Charts Section */}
      <div className="mb-8">
        {/* Revenue Trend Chart */}
        <ChartCard 
          title={tOverview('revenueTrendTitle')} 
          subtitle={tOverview('revenueTrendSubtitle')}
        >
          <ChartWrapper
            data={displayRevenueChartData}
            type="line"
            dataKey="revenue"
            isLoading={isLoadingRevenue}
            loadingMessage={tOverview('messages.loading')}
            emptyMessage={tOverview('messages.noData')}
            tooltipFormatter={(value: number) => [formatCurrency(value), tOverview('charts.revenueTooltip')]}
          />
        </ChartCard>
      </div>

      {/* Insights Section */}
      {topInsights.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{tOverview('topInsights')}</h2>
            <Link href="/dashboard/insights">
              <Button
                size="sm"
                variant="light"
                endContent={<ArrowRightIcon className="w-4 h-4" />}
              >
                {tOverview('viewAllInsights')}
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{tOverview('quickLinksTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickLinkCard
            href="/dashboard/revenue"
            icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
            title={tOverview('quickLinks.revenue')}
            description={tOverview('quickLinks.revenueDesc')}
            gradient="from-blue-500 to-purple-500"
          />
          <QuickLinkCard
            href="/dashboard/performance"
            icon={<BoltIcon className="w-6 h-6 text-white" />}
            title={tOverview('quickLinks.performance')}
            description={tOverview('quickLinks.performanceDesc')}
            gradient="from-green-500 to-emerald-500"
          />
          <QuickLinkCard
            href="/dashboard/analytics"
            icon={<LightBulbIcon className="w-6 h-6 text-white" />}
            title={tOverview('quickLinks.analytics')}
            description={tOverview('quickLinks.analyticsDesc')}
            gradient="from-purple-500 to-pink-500"
          />
          <QuickLinkCard
            href="/dashboard/insights"
            icon={<LightBulbIcon className="w-6 h-6 text-white" />}
            title={tOverview('quickLinks.insights')}
            description={tOverview('quickLinks.insightsDesc')}
            gradient="from-orange-500 to-red-500"
          />
        </div>
      </div>
    </PageWrapper>
  );
}

