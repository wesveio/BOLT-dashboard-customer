'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tabs, Tab } from '@heroui/react';
import {
  GlobeAltIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useGeographyData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { periodOptions, type Period } from '@/utils/default-data';
import { usePeriod } from '@/contexts/PeriodContext';

const COLORS = ['#2563eb', '#9333ea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function GeographyAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.geography');
  const { period, setPeriod, startDate, endDate } = usePeriod();
  const [selectedTab, setSelectedTab] = useState('countries');
  const { countries, states, summary, isLoading, error, refetch } = useGeographyData({ period, startDate, endDate });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading geography analytics..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load geography analytics" onRetry={refetch} />
      </PageWrapper>
    );
  }

  // Prepare chart data
  const topCountries = countries.slice(0, 10);
  const topStates = states.slice(0, 10);

  const revenueByCountryData = topCountries.map((country) => ({
    country: country.country,
    revenue: country.revenue,
    orders: country.orders,
    conversionRate: country.conversionRate,
  }));

  const revenueByStateData = topStates.map((state) => ({
    state: `${state.state}, ${state.country}`,
    revenue: state.revenue,
    orders: state.orders,
    conversionRate: state.conversionRate,
  }));

  const countriesPieData = topCountries.map((country) => ({
    name: country.country,
    value: country.revenue,
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
          title="Total Sessions"
          value={formatNumber(summary.totalSessions)}
          subtitle={`Across ${summary.countriesCount} countries`}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          subtitle={`${formatNumber(summary.totalOrders)} orders`}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Overall Conversion"
          value={formatPercentage(summary.overallConversionRate)}
          subtitle="Global conversion rate"
          icon={<GlobeAltIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Regions Tracked"
          value={formatNumber(summary.statesCount)}
          subtitle={`States/regions analyzed`}
          icon={<MapPinIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Tabs for Countries/States */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        className="mb-8"
      >
        <Tab key="countries" title="By Country">
          <div className="mt-6 space-y-6">
            {/* Revenue by Country Chart */}
            <ChartCard
              title="Revenue by Country"
              subtitle="Top countries by revenue"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByCountryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="country"
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
                      name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                      name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Conversion Rate',
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Revenue Distribution Pie Chart */}
            <ChartCard
              title="Revenue Distribution"
              subtitle="Percentage of revenue by country"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={countriesPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {countriesPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Countries Table */}
            <ChartCard
              title="Countries Breakdown"
              subtitle="Detailed metrics by country"
            >
              <div className="overflow-x-auto">
                <Table aria-label="Countries table" removeWrapper>
                  <TableHeader>
                    <TableColumn>COUNTRY</TableColumn>
                    <TableColumn>SESSIONS</TableColumn>
                    <TableColumn>ORDERS</TableColumn>
                    <TableColumn>REVENUE</TableColumn>
                    <TableColumn>AOV</TableColumn>
                    <TableColumn>CONVERSION RATE</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {countries.map((country) => (
                      <TableRow key={country.country}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GlobeAltIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">{country.country}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatNumber(country.sessions)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatNumber(country.orders)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(country.revenue)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatCurrency(country.avgOrderValue)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPercentage(country.conversionRate)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ChartCard>
          </div>
        </Tab>

        <Tab key="states" title="By State/Region">
          <div className="mt-6 space-y-6">
            {/* Revenue by State Chart */}
            <ChartCard
              title="Revenue by State/Region"
              subtitle="Top states/regions by revenue"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByStateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="state"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
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
                      name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Conversion Rate',
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#9333ea" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* States Table */}
            <ChartCard
              title="States/Regions Breakdown"
              subtitle="Detailed metrics by state/region"
            >
              <div className="overflow-x-auto">
                <Table aria-label="States table" removeWrapper>
                  <TableHeader>
                    <TableColumn>COUNTRY</TableColumn>
                    <TableColumn>STATE/REGION</TableColumn>
                    <TableColumn>SESSIONS</TableColumn>
                    <TableColumn>ORDERS</TableColumn>
                    <TableColumn>REVENUE</TableColumn>
                    <TableColumn>AOV</TableColumn>
                    <TableColumn>CONVERSION RATE</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {states.map((state, index) => (
                      <TableRow key={`${state.country}-${state.state}-${index}`}>
                        <TableCell>
                          <span className="text-sm text-gray-600">{state.country}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">{state.state}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatNumber(state.sessions)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatNumber(state.orders)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(state.revenue)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatCurrency(state.avgOrderValue)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPercentage(state.conversionRate)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ChartCard>
          </div>
        </Tab>
      </Tabs>
    </PageWrapper>
  );
}

