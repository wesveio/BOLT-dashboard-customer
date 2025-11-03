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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectItem } from '@heroui/react';
import { useRevenueData } from '@/hooks/useDashboardData';
import { periodOptions, Period } from '@/utils/default-data';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export default function RevenuePage() {
  const t = useTranslations('dashboard.revenue');
  const [period, setPeriod] = useState<Period>('week');
  const { metrics, chartData, isLoading, error, refetch } = useRevenueData({ period });

  const displayMetrics = useMemo(() => metrics, [metrics]);
  const displayRevenueData = useMemo(() => chartData, [chartData]);

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
            value: parseFloat(displayMetrics.revenueGrowth || '0'),
            isPositive: parseFloat(displayMetrics.revenueGrowth || '0') > 0,
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
          <div className="text-center py-8 text-gray-500">
            {t('charts.hourlyBreakdownComingSoon')}
          </div>
        </ChartCard>
        <ChartCard title={t('charts.revenueByDay')} subtitle={t('charts.weeklyPattern')}>
          <div className="text-center py-8 text-gray-500">
            {t('charts.dailyBreakdownComingSoon')}
          </div>
        </ChartCard>
      </div>
    </PageWrapper>
  );
}

