'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Select, SelectItem } from '@heroui/react';
import { useRevenueData } from '@/hooks/useDashboardData';
import { periodOptions, Period } from '@/utils/default-data';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export default function RevenuePage() {
  const t = useTranslations('dashboard.revenue');
  const [period, setPeriod] = useState<Period>('week');
  const { metrics, chartData, revenueByHour, revenueByDay, isLoading, error, refetch } = useRevenueData({ period });

  // Ensure all metrics are non-negative before displaying
  // Preserve exact financial values - no rounding
  const displayMetrics = useMemo(() => {
    return {
      ...metrics,
      totalRevenue: Math.max(0, typeof metrics.totalRevenue === 'string' ? parseFloat(metrics.totalRevenue) : metrics.totalRevenue || 0),
      avgOrderValue: Math.max(0, typeof metrics.avgOrderValue === 'string' ? parseFloat(metrics.avgOrderValue) : metrics.avgOrderValue || 0),
      totalOrders: Math.max(0, typeof metrics.totalOrders === 'string' ? parseFloat(metrics.totalOrders) : metrics.totalOrders || 0),
      revenuePerHour: Math.max(0, typeof metrics.revenuePerHour === 'string' ? parseFloat(metrics.revenuePerHour) : metrics.revenuePerHour || 0),
      // revenueGrowth can be number or string, preserve exact value
      revenueGrowth: typeof metrics.revenueGrowth === 'number' 
        ? metrics.revenueGrowth 
        : (typeof metrics.revenueGrowth === 'string' ? parseFloat(metrics.revenueGrowth) : 0),
    };
  }, [metrics]);
  
  // Ensure chart data values are non-negative
  const displayRevenueData = useMemo(() => {
    return chartData.map(item => ({
      ...item,
      revenue: Math.max(0, item.revenue || 0),
    }));
  }, [chartData]);

  // Process revenue by hour data - ensure non-negative and preserve exact values
  const displayRevenueByHour = useMemo(() => {
    if (!revenueByHour || revenueByHour.length === 0) {
      // Return empty array with all 24 hours at 0
      return Array.from({ length: 24 }, (_, i) => ({
        hour: i.toString().padStart(2, '0') + ':00',
        revenue: 0,
      }));
    }
    return revenueByHour.map(item => ({
      ...item,
      revenue: Math.max(0, item.revenue || 0),
    }));
  }, [revenueByHour]);

  // Process revenue by day data - ensure non-negative and preserve exact values
  const displayRevenueByDay = useMemo(() => {
    if (!revenueByDay || revenueByDay.length === 0) {
      return [];
    }
    return revenueByDay.map(item => ({
      ...item,
      revenue: Math.max(0, item.revenue || 0),
    }));
  }, [revenueByDay]);

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
            value: typeof displayMetrics.revenueGrowth === 'number' 
              ? displayMetrics.revenueGrowth 
              : parseFloat(String(displayMetrics.revenueGrowth || '0')),
            isPositive: (typeof displayMetrics.revenueGrowth === 'number' 
              ? displayMetrics.revenueGrowth 
              : parseFloat(String(displayMetrics.revenueGrowth || '0'))) > 0,
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
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayRevenueData}>
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
                formatter={(value: number) => [`$${value.toLocaleString()}`, t('charts.revenueTooltip')]}
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
        </ChartCard>
      </div>

      {/* Additional Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title={t('charts.revenueByHour')} subtitle={t('charts.peakHoursAnalysis')}>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              {t('messages.loading')}
            </div>
          ) : displayRevenueByHour.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('charts.noData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayRevenueByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="hour"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                  formatter={(value: number) => [formatCurrency(value), t('charts.revenueTooltip')]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
        <ChartCard title={t('charts.revenueByDay')} subtitle={t('charts.weeklyPattern')}>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              {t('messages.loading')}
            </div>
          ) : displayRevenueByDay.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('charts.noData')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={displayRevenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="day"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
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
                  formatter={(value: number) => [formatCurrency(value), t('charts.revenueTooltip')]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#2563eb"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </PageWrapper>
  );
}

