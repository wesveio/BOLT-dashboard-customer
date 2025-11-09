'use client';

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
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLTVData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { getTranslatedPeriodOptions } from '@/utils/default-data';
import { usePeriod } from '@/contexts/PeriodContext';

export default function LTVAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.ltv');
  const tPeriods = useTranslations('dashboard.common.periods');
  const { period, setPeriod, startDate, endDate } = usePeriod();
  const { summary, customers, ltvBySegment, isLoading, error, refetch } = useLTVData({ period, startDate, endDate });

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

  // Prepare chart data
  const segmentData = Object.entries(ltvBySegment).map(([segment, data]) => ({
    segment: segment.charAt(0).toUpperCase() + segment.slice(1),
    customers: data.customers,
    avgLTV: data.avgLTV,
    totalRevenue: data.totalRevenue,
  }));

  const ltvDistributionData = [
    { name: t('highLTV'), value: summary.ltvSegments.high, color: '#10b981' },
    { name: t('mediumLTV'), value: summary.ltvSegments.medium, color: '#f59e0b' },
    { name: t('lowLTV'), value: summary.ltvSegments.low, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const topCustomers = customers.slice(0, 10);

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
          title={t('averageLTV')}
          value={formatCurrency(summary.avgLTV)}
          subtitle={t('customerLifetimeValue')}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('totalCustomers')}
          value={formatNumber(summary.totalCustomers)}
          subtitle={t('uniqueCustomersAnalyzed')}
          icon={<UserGroupIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgOrdersCustomer')}
          value={formatNumber(summary.avgOrdersPerCustomer, { maximumFractionDigits: 1 })}
          subtitle={t('averagePurchaseFrequency')}
          icon={<ShoppingBagIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('recurringRate')}
          value={formatPercentage(summary.recurringRate)}
          subtitle={t('repeatCustomers', { count: customers.filter(c => c.isRecurring).length })}
          icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* LTV Distribution */}
      <div className="mb-8">
        <ChartCard
          title={t('ltvDistributionTitle')}
          subtitle={t('ltvDistributionSubtitle')}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ltvDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ltvDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* LTV by Segment */}
      {segmentData.length > 0 && (
        <div className="mb-8">
          <ChartCard
            title={t('ltvBySegmentTitle')}
            subtitle={t('ltvBySegmentSubtitle')}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="segment"
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
                  formatter={(value: number, name: string) => [
                    name === 'avgLTV' ? formatCurrency(value) : formatNumber(value),
                    name === 'avgLTV' ? t('avgLTV') : name === 'customers' ? t('customers') : t('revenue'),
                  ]}
                />
                <Bar dataKey="avgLTV" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Top Customers Table */}
      {customers.length > 0 ? (
        <ChartCard
          title={t('topCustomersTitle')}
          subtitle={t('topCustomersSubtitle')}
        >
          <div className="overflow-x-auto">
            <Table aria-label="Top customers table" removeWrapper>
              <TableHeader>
                <TableColumn>{t('customer')}</TableColumn>
                <TableColumn>{t('orders')}</TableColumn>
                <TableColumn>{t('ltv')}</TableColumn>
                <TableColumn>{t('avgOrderValue')}</TableColumn>
                <TableColumn>{t('frequency')}</TableColumn>
                <TableColumn>{t('status')}</TableColumn>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer, index) => (
                  <TableRow key={customer.customerId || `customer-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-600">
                          {customer.customerId ? customer.customerId.substring(0, 8) + '...' : t('anonymous')}
                        </span>
                        {customer.isRecurring && (
                          <Chip color="success" variant="flat" size="sm">
                            {t('recurring')}
                          </Chip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatNumber(customer.orders)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(customer.revenue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(customer.avgOrderValue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatNumber(customer.purchaseFrequency, { maximumFractionDigits: 1 })} {t('ordersPerMonth')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={customer.isRecurring ? 'success' : 'default'}
                        variant="flat"
                        size="sm"
                      >
                        {customer.isRecurring ? t('recurring') : t('new')}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      ) : (
        <ChartCard title={t('noCustomerDataTitle')} subtitle={t('noCustomerDataSubtitle')}>
          <div className="text-center py-12 text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold mb-2">{t('noCustomersFound')}</p>
            <p className="text-sm">{t('tryDifferentPeriod')}</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

