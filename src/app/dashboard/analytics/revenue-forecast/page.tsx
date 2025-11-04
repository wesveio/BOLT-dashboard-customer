'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { Select, SelectItem, Chip } from '@heroui/react';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useRevenueForecastData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { periodOptions, Period } from '@/utils/default-data';

export default function RevenueForecastPage() {
  const t = useTranslations('dashboard.analytics.revenueForecast');
  const [period, setPeriod] = useState<Period>('month');
  const [forecastDays, setForecastDays] = useState<number>(30);
  const { summary, historical, forecast, accuracy, isLoading, error, refetch } = useRevenueForecastData({
    period,
    forecastDays,
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading revenue forecast..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load revenue forecast" onRetry={refetch} />
      </PageWrapper>
    );
  }

  // Combine historical and forecast data for chart
  const chartData = [
    ...historical.map(h => ({
      date: h.date,
      revenue: h.revenue,
      forecast: null,
      lowerBound: null,
      upperBound: null,
      type: 'historical' as const,
    })),
    ...forecast.map(f => ({
      date: f.date,
      revenue: null,
      forecast: f.forecast,
      lowerBound: f.lowerBound,
      upperBound: f.upperBound,
      type: 'forecast' as const,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const trendIcon =
    summary.trend === 'increasing' ? (
      <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
    ) : summary.trend === 'decreasing' ? (
      <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
    ) : (
      <MinusIcon className="w-6 h-6 text-white" />
    );

  return (
    <PageWrapper>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <div className="flex gap-4">
            <Select
              size="sm"
              selectedKeys={[forecastDays.toString()]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0]?.toString();
                if (selected) {
                  setForecastDays(parseInt(selected));
                }
              }}
              className="w-32"
            >
              <SelectItem key="7" textValue="7">
                7 Days
              </SelectItem>
              <SelectItem key="30" textValue="30">
                30 Days
              </SelectItem>
              <SelectItem key="90" textValue="90">
                90 Days
              </SelectItem>
            </Select>
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
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="7-Day Forecast"
          value={formatCurrency(summary.forecast7Revenue)}
          subtitle="Next 7 days"
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="30-Day Forecast"
          value={formatCurrency(summary.forecast30Revenue)}
          subtitle="Next 30 days"
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="90-Day Forecast"
          value={formatCurrency(summary.forecast90Revenue)}
          subtitle="Next 90 days"
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Trend"
          value={summary.trend.charAt(0).toUpperCase() + summary.trend.slice(1)}
          subtitle={`${summary.avgGrowth >= 0 ? '+' : ''}${formatCurrency(summary.avgGrowth)}/day`}
          icon={trendIcon}
        />
      </div>

      {/* Revenue Forecast Chart */}
      <div className="mb-8">
        <ChartCard
          title="Revenue Forecast"
          subtitle="Historical data and forecasted revenue with confidence intervals"
        >
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                formatter={(value: number | null, name: string) => {
                  if (value === null) return ['N/A', name];
                  return [formatCurrency(value), name];
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              {/* Historical Revenue */}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
                fill="url(#colorHistorical)"
                name="Historical Revenue"
                connectNulls={false}
              />
              {/* Forecast */}
              <Area
                type="monotone"
                dataKey="forecast"
                stroke="#9333ea"
                strokeWidth={3}
                strokeDasharray="5 5"
                fill="url(#colorForecast)"
                name="Forecast"
                connectNulls={false}
              />
              {/* Confidence Interval Upper */}
              <Line
                type="monotone"
                dataKey="upperBound"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Upper Bound"
              />
              {/* Confidence Interval Lower */}
              <Line
                type="monotone"
                dataKey="lowerBound"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="Lower Bound"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title="Forecast Summary"
          subtitle="Revenue projections by period"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">7-Day Forecast</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(summary.forecast7Revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">30-Day Forecast</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(summary.forecast30Revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">90-Day Forecast</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(summary.forecast90Revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-gray-600">Average Daily Forecast</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(summary.avgForecastRevenue)}
              </span>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Historical Summary"
          subtitle="Past performance metrics"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Historical Revenue</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(summary.totalHistoricalRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Daily Revenue</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(summary.avgDailyRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Trend</span>
              <Chip
                color={
                  summary.trend === 'increasing' ? 'success' :
                  summary.trend === 'decreasing' ? 'danger' :
                  'default'
                }
                variant="flat"
                size="sm"
              >
                {summary.trend.charAt(0).toUpperCase() + summary.trend.slice(1)}
              </Chip>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-gray-600">Daily Growth</span>
              <span className={`text-lg font-semibold ${
                summary.avgGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {summary.avgGrowth >= 0 ? '+' : ''}{formatCurrency(summary.avgGrowth)}
              </span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Forecast Accuracy */}
      {accuracy && (
        <ChartCard
          title="Forecast Accuracy"
          subtitle="Model performance metrics (when available)"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Mean Absolute Error</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(accuracy.mae)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Mean Absolute % Error</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(accuracy.mape, { maximumFractionDigits: 2 })}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Root Mean Squared Error</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(accuracy.rmse)}</p>
            </div>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

