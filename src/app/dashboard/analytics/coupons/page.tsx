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
  TicketIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useCouponsData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { periodOptions, Period } from '@/utils/default-data';

const COLORS = ['#2563eb', '#9333ea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CouponsAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.coupons');
  const [period, setPeriod] = useState<Period>('week');
  const { coupons, summary, isLoading, error, refetch } = useCouponsData({ period });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading coupons analytics..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load coupons analytics" onRetry={refetch} />
      </PageWrapper>
    );
  }

  // Prepare chart data
  const couponUsageData = coupons.slice(0, 10).map((coupon) => ({
    code: coupon.code.length > 10 ? coupon.code.substring(0, 10) + '...' : coupon.code,
    count: coupon.count,
    revenue: coupon.revenue,
    discount: coupon.totalDiscount,
  }));

  const revenueComparisonData = [
    {
      category: 'With Discount',
      revenue: summary.revenueWithDiscount,
      orders: summary.ordersWithDiscount,
    },
    {
      category: 'Without Discount',
      revenue: summary.revenueWithoutDiscount,
      orders: summary.ordersWithoutDiscount,
    },
  ];

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
          title="Coupon Usage Rate"
          value={formatPercentage(summary.couponUsageRate)}
          subtitle={`${summary.ordersWithDiscount} of ${summary.ordersWithDiscount + summary.ordersWithoutDiscount} orders`}
          icon={<TicketIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Total Discounts"
          value={formatNumber(summary.totalDiscounts)}
          subtitle="Coupons applied"
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Total Discount Amount"
          value={formatCurrency(summary.totalDiscountAmount)}
          subtitle={`Avg: ${formatCurrency(summary.avgDiscountAmount)}`}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Revenue with Discount"
          value={formatCurrency(summary.revenueWithDiscount)}
          subtitle={`${formatNumber(summary.ordersWithDiscount)} orders`}
          icon={<ShoppingBagIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Revenue Comparison */}
      <div className="mb-8">
        <ChartCard
          title="Revenue Comparison"
          subtitle="Revenue with and without discounts"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="category"
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
                  name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                  name === 'revenue' ? 'Revenue' : 'Orders',
                ]}
              />
              <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Coupons Usage */}
      <div className="mb-8">
        <ChartCard
          title="Top Coupons by Usage"
          subtitle="Most used coupon codes"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={couponUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="code"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#9333ea" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Coupons Details Table */}
      {coupons.length > 0 ? (
        <ChartCard
          title="Coupon Details"
          subtitle="Detailed breakdown of all coupon codes"
        >
          <div className="overflow-x-auto">
            <Table aria-label="Coupons table" removeWrapper>
              <TableHeader>
                <TableColumn>COUPON CODE</TableColumn>
                <TableColumn>USAGE</TableColumn>
                <TableColumn>TOTAL DISCOUNT</TableColumn>
                <TableColumn>AVG DISCOUNT</TableColumn>
                <TableColumn>REVENUE</TableColumn>
                <TableColumn>ORDERS</TableColumn>
                <TableColumn>AOV</TableColumn>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.code}>
                    <TableCell>
                      <Chip color="primary" variant="flat" size="sm" className="font-mono font-bold">
                        {coupon.code}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatNumber(coupon.count)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(coupon.totalDiscount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(coupon.avgDiscount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(coupon.revenue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatNumber(coupon.orders)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(coupon.avgOrderValue)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      ) : (
        <ChartCard title="No Coupon Data" subtitle="No coupons were used in the selected period">
          <div className="text-center py-12 text-gray-500">
            <TicketIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold mb-2">No coupons found</p>
            <p className="text-sm">Try selecting a different time period.</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

