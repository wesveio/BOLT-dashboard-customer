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
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLTVData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { periodOptions, Period } from '@/utils/default-data';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export default function LTVAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.ltv');
  const [period, setPeriod] = useState<Period>('month');
  const { summary, customers, ltvBySegment, isLoading, error, refetch } = useLTVData({ period });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading LTV analytics..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load LTV analytics" onRetry={refetch} />
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
    { name: 'High LTV', value: summary.ltvSegments.high, color: '#10b981' },
    { name: 'Medium LTV', value: summary.ltvSegments.medium, color: '#f59e0b' },
    { name: 'Low LTV', value: summary.ltvSegments.low, color: '#ef4444' },
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
          title="Average LTV"
          value={formatCurrency(summary.avgLTV)}
          subtitle="Customer lifetime value"
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Total Customers"
          value={formatNumber(summary.totalCustomers)}
          subtitle="Unique customers analyzed"
          icon={<UserGroupIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Avg Orders/Customer"
          value={formatNumber(summary.avgOrdersPerCustomer, { maximumFractionDigits: 1 })}
          subtitle="Average purchase frequency"
          icon={<ShoppingBagIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Recurring Rate"
          value={formatPercentage(summary.recurringRate)}
          subtitle={`${customers.filter(c => c.isRecurring).length} repeat customers`}
          icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* LTV Distribution */}
      <div className="mb-8">
        <ChartCard
          title="LTV Distribution"
          subtitle="Customer segments by lifetime value"
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
            title="LTV by Customer Segment"
            subtitle="Average LTV by customer type"
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
                    name === 'avgLTV' ? 'Avg LTV' : name === 'customers' ? 'Customers' : 'Revenue',
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
          title="Top Customers by LTV"
          subtitle="Highest lifetime value customers"
        >
          <div className="overflow-x-auto">
            <Table aria-label="Top customers table" removeWrapper>
              <TableHeader>
                <TableColumn>CUSTOMER</TableColumn>
                <TableColumn>ORDERS</TableColumn>
                <TableColumn>LTV</TableColumn>
                <TableColumn>AVG ORDER VALUE</TableColumn>
                <TableColumn>FREQUENCY</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer, index) => (
                  <TableRow key={customer.customerId || `customer-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-600">
                          {customer.customerId ? customer.customerId.substring(0, 8) + '...' : 'Anonymous'}
                        </span>
                        {customer.isRecurring && (
                          <Chip color="success" variant="flat" size="sm">
                            Recurring
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
                        {formatNumber(customer.purchaseFrequency, { maximumFractionDigits: 1 })} orders/mo
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={customer.isRecurring ? 'success' : 'default'}
                        variant="flat"
                        size="sm"
                      >
                        {customer.isRecurring ? 'Recurring' : 'New'}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      ) : (
        <ChartCard title="No Customer Data" subtitle="No customer data available in the selected period">
          <div className="text-center py-12 text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold mb-2">No customers found</p>
            <p className="text-sm">Try selecting a different time period.</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

