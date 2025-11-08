'use client';

import { useState } from 'react';
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
  ArrowPathIcon,
  XCircleIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useRetentionData } from '@/hooks/useDashboardData';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { getTranslatedPeriodOptions, Period } from '@/utils/default-data';

export default function RetentionAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.retention');
  const tPeriods = useTranslations('dashboard.common.periods');
  const [period, setPeriod] = useState<Period>('month');
  const { summary, cohorts, isLoading, error, refetch } = useRetentionData({ period });

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

  // Prepare retention rates chart data
  const retentionRatesData = [
    { period: 'D1', rate: summary.retentionRates.d1 },
    { period: 'D7', rate: summary.retentionRates.d7 },
    { period: 'D30', rate: summary.retentionRates.d30 },
    { period: 'D90', rate: summary.retentionRates.d90 },
  ];

  // Prepare cohort retention data
  const cohortChartData = cohorts
    .filter(cohort => cohort.customers > 0) // Only include cohorts with customers
    .map(cohort => ({
      cohort: cohort.cohort,
      d30: cohort.retentionByPeriod.d30,
      d60: cohort.retentionByPeriod.d60,
      d90: cohort.retentionByPeriod.d90,
    }));

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
            {getTranslatedPeriodOptions(tPeriods).map((option) => (
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
          title={t('retentionRate')}
          value={formatPercentage(summary.retentionRate)}
          subtitle={t('returningCustomers', { count: summary.returningCustomers })}
          icon={<ArrowPathIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('churnRate')}
          value={formatPercentage(summary.churnRate)}
          subtitle={t('churnedCustomers', { count: summary.churnedCustomers })}
          icon={<XCircleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgPurchaseFrequency')}
          value={formatNumber(summary.avgPurchaseFrequency, { maximumFractionDigits: 1 })}
          subtitle={t('ordersPerCustomer')}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgDaysBetweenOrders')}
          value={formatNumber(summary.avgDaysBetweenPurchases)}
          subtitle={t('forReturningCustomers')}
          icon={<ClockIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Customer Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title={t('newCustomers')}
          value={formatNumber(summary.newCustomers)}
          subtitle={t('firstTimeBuyers')}
          icon={<UserGroupIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('returningCustomersLabel')}
          value={formatNumber(summary.returningCustomers)}
          subtitle={t('repeatBuyers')}
          icon={<ArrowPathIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('totalCustomers')}
          value={formatNumber(summary.totalCustomers)}
          subtitle={t('allCustomers')}
          icon={<UserGroupIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Retention Rates by Period */}
      <div className="mb-8">
        <ChartCard
          title={t('retentionRatesByPeriodTitle')}
          subtitle={t('retentionRatesByPeriodSubtitle')}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={retentionRatesData}>
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
                formatter={(value: number) => [`${value.toFixed(1)}%`, t('retentionRateLabel')]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Cohort Analysis */}
      {cohortChartData.length > 0 && (
        <div className="mb-8">
          <ChartCard
            title={t('cohortRetentionAnalysisTitle')}
            subtitle={t('cohortRetentionAnalysisSubtitle')}
          >
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={cohortChartData}>
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
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, t('retention')]}
                />
                <Legend />
                <Bar dataKey="d30" fill="#2563eb" radius={[8, 8, 0, 0]} name="D30" />
                <Bar dataKey="d60" fill="#9333ea" radius={[8, 8, 0, 0]} name="D60" />
                <Bar dataKey="d90" fill="#10b981" radius={[8, 8, 0, 0]} name="D90" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Cohort Details Table */}
      {cohorts.length > 0 ? (
        <ChartCard
          title={t('cohortDetailsTitle')}
          subtitle={t('cohortDetailsSubtitle')}
        >
          <div className="overflow-x-auto">
            <Table aria-label="Cohorts table" removeWrapper>
              <TableHeader>
                <TableColumn>{t('cohort')}</TableColumn>
                <TableColumn>{t('customers')}</TableColumn>
                <TableColumn>{t('d30Retention')}</TableColumn>
                <TableColumn>{t('d60Retention')}</TableColumn>
                <TableColumn>{t('d90Retention')}</TableColumn>
              </TableHeader>
              <TableBody>
                {cohorts.map((cohort) => (
                  <TableRow key={cohort.cohort}>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-900">{cohort.cohort}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatNumber(cohort.customers)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={cohort.retentionByPeriod.d30 >= 50 ? 'success' : cohort.retentionByPeriod.d30 >= 30 ? 'warning' : 'danger'}
                        variant="flat"
                        size="sm"
                      >
                        {formatPercentage(cohort.retentionByPeriod.d30)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={cohort.retentionByPeriod.d60 >= 50 ? 'success' : cohort.retentionByPeriod.d60 >= 30 ? 'warning' : 'danger'}
                        variant="flat"
                        size="sm"
                      >
                        {formatPercentage(cohort.retentionByPeriod.d60)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={cohort.retentionByPeriod.d90 >= 50 ? 'success' : cohort.retentionByPeriod.d90 >= 30 ? 'warning' : 'danger'}
                        variant="flat"
                        size="sm"
                      >
                        {formatPercentage(cohort.retentionByPeriod.d90)}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      ) : (
        <ChartCard title={t('noCohortDataTitle')} subtitle={t('noCohortDataSubtitle')}>
          <div className="text-center py-12 text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold mb-2">{t('noCohortsFound')}</p>
            <p className="text-sm">{t('tryDifferentPeriod')}</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

