'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardBody, Select, SelectItem, Button } from '@heroui/react';
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
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { useMetricsData, useRevenueData, usePerformanceData } from '@/hooks/useDashboardData';
import { useApi } from '@/hooks/useApi';
import { formatCurrency, formatNumber, formatPercentage, formatDuration } from '@/utils/formatters';
import { periodOptions } from '@/utils/default-data';
import { usePeriod } from '@/contexts/PeriodContext';
import { CustomPeriodSelector } from '@/components/Dashboard/CustomPeriodSelector/CustomPeriodSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Insight } from '@/app/dashboard/insights/page';

export default function DashboardPage() {
  const tOverview = useTranslations('dashboard.overview');
  const { isLoading: isLoadingAuth } = useDashboardAuth();
  const { period, setPeriod, startDate, endDate } = usePeriod();
  
  // Fetch all data in parallel
  const { metrics, isLoading: isLoadingMetrics, error: metricsError, refetch: refetchMetrics } = useMetricsData({ period, startDate, endDate });
  const { metrics: revenueMetrics, chartData, isLoading: isLoadingRevenue } = useRevenueData({ period, startDate, endDate });
  const { metrics: performanceMetrics, isLoading: isLoadingPerformance } = usePerformanceData({ period, startDate, endDate });
  const { data: insightsData } = useApi<{ insights: Insight[] }>('/api/dashboard/insights', {
    cacheKey: 'insights',
    cacheTTL: 5,
  });

  // Calculate trends from revenue growth (already available)
  const revenueGrowth = useMemo(() => {
    const growth = typeof revenueMetrics.revenueGrowth === 'string' 
      ? parseFloat(revenueMetrics.revenueGrowth) 
      : (typeof revenueMetrics.revenueGrowth === 'number' ? revenueMetrics.revenueGrowth : 0);
    return growth;
  }, [revenueMetrics.revenueGrowth]);

  // Top 3 high-impact insights
  const topInsights = useMemo(() => {
    const insights = insightsData?.insights || [];
    return insights
      .filter((i) => i.impact === 'high')
      .slice(0, 3);
  }, [insightsData]);

  // Prepare revenue chart data
  const displayRevenueChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    return chartData.map((item) => ({
      ...item,
      revenue: Math.max(0, item.revenue || 0),
    }));
  }, [chartData]);

  const isLoading = isLoadingMetrics || isLoadingRevenue || isLoadingPerformance;
  const error = metricsError;

  return (
    <PageWrapper>
      <PageHeader
        title={tOverview('title')}
        subtitle={tOverview('welcome')}
        action={
          <Select
            size="sm"
            selectedKeys={[period]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as Period;
              setPeriod(selected);
            }}
            className="w-40"
          >
            {periodOptions.map((option) => (
              <SelectItem key={option.value} textValue={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        }
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
              value={formatCurrency(
                typeof revenueMetrics.avgOrderValue === 'string'
                  ? parseFloat(revenueMetrics.avgOrderValue)
                  : revenueMetrics.avgOrderValue || 0
              )}
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
              value={formatPercentage(revenueGrowth, 1)}
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
          {isLoadingRevenue ? (
            <div className="text-center py-8 text-gray-500">
              {tOverview('messages.loading')}
            </div>
          ) : displayRevenueChartData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {tOverview('messages.noData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={displayRevenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), tOverview('charts.revenueTooltip')]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
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
            {topInsights.map((insight) => {
              const IconMap = {
                success: CheckCircleIcon,
                warning: ExclamationTriangleIcon,
                info: InformationCircleIcon,
                recommendation: LightBulbIcon,
              };
              const Icon = IconMap[insight.type];
              const colorMap = {
                success: 'bg-green-50 border-green-300 text-green-700',
                warning: 'bg-orange-50 border-orange-300 text-orange-700',
                info: 'bg-blue-50 border-blue-300 text-blue-700',
                recommendation: 'bg-purple-50 border-purple-300 text-purple-700',
              };
              const colors = colorMap[insight.type];

              return (
                <Card
                  key={insight.id}
                  className={`border-2 ${colors} hover:shadow-lg transition-all duration-200`}
                >
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${colors.split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${colors.split(' ')[2]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-bold ${colors.split(' ')[2]} mb-1 line-clamp-1`}>
                          {insight.title}
                        </h3>
                        <p className={`text-xs ${colors.split(' ')[2]} mb-2 line-clamp-2`}>
                          {insight.description}
                        </p>
                        {insight.action && (
                          <Link href={insight.action.href}>
                            <Button
                              size="sm"
                              variant="light"
                              className={`text-xs ${colors.split(' ')[2]} p-0 h-auto`}
                            >
                              {insight.action.label} →
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{tOverview('quickLinksTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/revenue">
            <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
              <CardBody className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{tOverview('quickLinks.revenue')}</h3>
                    <p className="text-sm text-gray-600">{tOverview('quickLinks.revenueDesc')}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
          <Link href="/dashboard/performance">
            <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
              <CardBody className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <BoltIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{tOverview('quickLinks.performance')}</h3>
                    <p className="text-sm text-gray-600">{tOverview('quickLinks.performanceDesc')}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
          <Link href="/dashboard/analytics">
            <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
              <CardBody className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <LightBulbIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{tOverview('quickLinks.analytics')}</h3>
                    <p className="text-sm text-gray-600">{tOverview('quickLinks.analyticsDesc')}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
          <Link href="/dashboard/insights">
            <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
              <CardBody className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <LightBulbIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{tOverview('quickLinks.insights')}</h3>
                    <p className="text-sm text-gray-600">{tOverview('quickLinks.insightsDesc')}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}

