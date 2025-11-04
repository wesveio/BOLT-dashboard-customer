'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from '@heroui/react';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCohortsData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { periodOptions, Period } from '@/utils/default-data';

export default function CohortsAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.cohorts');
  const [period, setPeriod] = useState<Period>('year');
  const { summary, cohorts, isLoading, error, refetch } = useCohortsData({ period });

  // Prepare average retention trend
  const avgRetentionTrend = useMemo(() => {
    return Array.from({ length: 12 }, (_, period) => ({
      period: `M${period}`,
      retentionRate: summary.avgRetentionByPeriod[period] || 0,
    }));
  }, [summary.avgRetentionByPeriod]);

  // Prepare cohort LTV chart
  const cohortLTVData = useMemo(() => {
    return cohorts.map(cohort => ({
      cohort: cohort.cohort,
      avgLTV: cohort.avgLTV,
      cohortSize: cohort.cohortSize,
    }));
  }, [cohorts]);

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading cohorts analysis..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load cohorts analysis" onRetry={refetch} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Cohorts"
          value={formatNumber(summary.totalCohorts)}
          subtitle="Cohorts analyzed"
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Total Customers"
          value={formatNumber(summary.totalCustomers)}
          subtitle={`Avg ${formatNumber(summary.avgCohortSize, { maximumFractionDigits: 0 })} per cohort`}
          icon={<UserGroupIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Average LTV"
          value={formatCurrency(summary.avgLTV)}
          subtitle="Per cohort"
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="M1 Retention"
          value={formatPercentage(summary.avgRetentionByPeriod[1] || 0)}
          subtitle="First month retention"
          icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Average Retention Trend */}
      <div className="mb-8">
        <ChartCard
          title="Average Retention Trend"
          subtitle="Retention rate by period (months since first purchase)"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={avgRetentionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Retention Rate']}
              />
              <Line
                type="monotone"
                dataKey="retentionRate"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Cohort Retention Matrix */}
      {cohorts.length > 0 && (
        <div className="mb-8">
          <ChartCard
            title="Cohort Retention Matrix"
            subtitle="Retention rates by cohort and period"
          >
            <div className="overflow-x-auto">
              <Table aria-label="Cohort retention matrix" removeWrapper>
                <TableHeader>
                  <TableColumn>COHORT</TableColumn>
                  <TableColumn>SIZE</TableColumn>
                  <TableColumn>M0</TableColumn>
                  <TableColumn>M1</TableColumn>
                  <TableColumn>M2</TableColumn>
                  <TableColumn>M3</TableColumn>
                  <TableColumn>M4</TableColumn>
                  <TableColumn>M5</TableColumn>
                  <TableColumn>M6</TableColumn>
                  <TableColumn>AVG LTV</TableColumn>
                </TableHeader>
                <TableBody>
                  {cohorts.map((cohort) => (
                    <TableRow key={cohort.cohort}>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">{cohort.cohort}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumber(cohort.cohortSize)}
                        </span>
                      </TableCell>
                      {(
                        cohort.retentionMatrix.slice(0, 7).map((period, idx) => (
                          <TableCell key={`${cohort.cohort}-period-${idx}`}>
                            <Chip
                              color={
                                period.retentionRate >= 50
                                  ? 'success'
                                  : period.retentionRate >= 30
                                  ? 'warning'
                                  : 'danger'
                              }
                              variant="flat"
                              size="sm"
                            >
                              {formatPercentage(period.retentionRate)}
                            </Chip>
                          </TableCell>
                        ))
                      ) as any}
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(cohort.avgLTV)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Cohort LTV Comparison */}
      <div className="mb-8">
        <ChartCard
          title="Cohort LTV Comparison"
          subtitle="Average LTV by cohort"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cohortLTVData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="cohort"
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
                formatter={(value: number, name: string) => [
                  name === 'avgLTV' ? formatCurrency(value) : formatNumber(value),
                  name === 'avgLTV' ? 'Avg LTV' : 'Cohort Size',
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgLTV"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 5 }}
                activeDot={{ r: 7 }}
                name="Avg LTV"
              />
              <Line
                type="monotone"
                dataKey="cohortSize"
                stroke="#9333ea"
                strokeWidth={2}
                dot={{ fill: '#9333ea', r: 4 }}
                name="Cohort Size"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {cohorts.length === 0 && (
        <ChartCard title="No Cohort Data" subtitle="No cohort data available in the selected period">
          <div className="text-center py-12 text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold mb-2">No cohorts found</p>
            <p className="text-sm">Try selecting a longer time period (month or year).</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

