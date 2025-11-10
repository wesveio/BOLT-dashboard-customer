'use client';

import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Card, CardBody } from '@heroui/react';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  StarIcon,
  ArrowPathIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useSegmentsData } from '@/hooks/useDashboardData';
import { formatCurrency, formatCompactCurrency, formatCompactNumber, formatNumber, formatPercentage } from '@/utils/formatters';
import { getTranslatedPeriodOptions, type Period } from '@/utils/default-data';
import { usePeriod } from '@/contexts/PeriodContext';

const COLORS = ['#2563eb', '#9333ea', '#10b981', '#f59e0b', '#ef4444'];

const SEGMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'VIP Customers': StarIcon,
  'Frequent Buyers': ArrowPathIcon,
  'New Customers': UserPlusIcon,
  'At-Risk Customers': ExclamationTriangleIcon,
  'Dormant Customers': MoonIcon,
};

const SEGMENT_COLORS: Record<string, string> = {
  'VIP Customers': 'success',
  'Frequent Buyers': 'primary',
  'New Customers': 'secondary',
  'At-Risk Customers': 'warning',
  'Dormant Customers': 'danger',
};

export default function SegmentsAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.segments');
  const tPeriods = useTranslations('dashboard.common.periods');
  const { period, setPeriod, startDate, endDate } = usePeriod();
  const { summary, segments, isLoading, error, refetch } = useSegmentsData({ period, startDate, endDate });

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
  const segmentSizeData = segments.map((segment, index) => ({
    name: segment.name,
    count: segment.metrics.count,
    revenue: segment.metrics.totalRevenue,
    color: COLORS[index % COLORS.length],
  }));

  const segmentLTVData = segments
    .filter(s => s.metrics.count > 0)
    .map((segment) => ({
      name: segment.name,
      avgLTV: segment.metrics.avgLTV,
      avgAOV: segment.metrics.avgAOV,
    }));

  const segmentPieData = segments
    .filter(s => s.metrics.count > 0)
    .map((segment) => ({
      name: segment.name,
      value: segment.metrics.count,
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
          title={t('totalCustomers')}
          value={formatCompactNumber(summary.totalCustomers, { threshold: 1_000_000 })}
          subtitle={t('acrossAllSegments')}
          icon={<UserGroupIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('overallAvgLTV')}
          value={formatCompactCurrency(summary.overallAvgLTV, 'USD', undefined, { threshold: 1_000_000 })}
          subtitle={t('averageLifetimeValue')}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('averageAOV')}
          value={formatCompactCurrency(summary.avgAOV, 'USD', undefined, { threshold: 1_000_000 })}
          subtitle={t('averageOrderValue')}
          icon={<ShoppingBagIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgOrders')}
          value={formatCompactNumber(summary.avgOrders, { threshold: 1_000_000, maximumFractionDigits: 1 })}
          subtitle={t('ordersPerCustomer')}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Segment Distribution */}
      <div className="mb-8">
        <ChartCard
          title={t('distributionTitle')}
          subtitle={t('distributionSubtitle')}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {segmentPieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={segmentSizeData[index]?.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Segment LTV Comparison */}
      {segmentLTVData.length > 0 && (
        <div className="mb-8">
          <ChartCard
            title={t('ltvBySegmentTitle')}
            subtitle={t('ltvBySegmentSubtitle')}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={segmentLTVData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
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
                    formatCurrency(value),
                    name === 'avgLTV' ? t('avgLTV') : t('avgAOV'),
                  ]}
                />
                <Bar dataKey="avgLTV" fill="#2563eb" radius={[8, 8, 0, 0]} name={t('avgLTV')} />
                <Bar dataKey="avgAOV" fill="#9333ea" radius={[8, 8, 0, 0]} name={t('avgAOV')} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Segment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {segments.map((segment) => {
          const Icon = SEGMENT_ICONS[segment.name] || UserGroupIcon;
          const color = SEGMENT_COLORS[segment.name] || 'default';

          return (
            <Card key={segment.name} className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                    color === 'success' ? 'from-green-500 to-emerald-500' :
                    color === 'primary' ? 'from-blue-500 to-purple-500' :
                    color === 'secondary' ? 'from-purple-500 to-pink-500' :
                    color === 'warning' ? 'from-yellow-500 to-orange-500' :
                    'from-red-500 to-pink-500'
                  } flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{segment.name}</h3>
                    <p className="text-xs text-gray-500">{segment.description}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('customers')}</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatNumber(segment.metrics.count)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('avgLTV')}</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(segment.metrics.avgLTV)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('totalRevenue')}</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(segment.metrics.totalRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('segmentShare')}</span>
                    <Chip color={color as any} variant="flat" size="sm">
                      {formatPercentage(segment.metrics.conversionRate)}
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Segments Details Table */}
      {segments.length > 0 ? (
        <ChartCard
          title={t('segmentDetailsTitle')}
          subtitle={t('segmentDetailsSubtitle')}
        >
          <div className="overflow-x-auto">
            <Table aria-label="Segments table" removeWrapper>
              <TableHeader>
                <TableColumn>{t('segment')}</TableColumn>
                <TableColumn>{t('customers')}</TableColumn>
                <TableColumn>{t('segmentShareCol')}</TableColumn>
                <TableColumn>{t('totalRevenue')}</TableColumn>
                <TableColumn>{t('avgLTVCol')}</TableColumn>
                <TableColumn>{t('avgAOVCol')}</TableColumn>
                <TableColumn>{t('avgOrdersCol')}</TableColumn>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => {
                  const color = SEGMENT_COLORS[segment.name] || 'default';
                  
                  return (
                    <TableRow key={segment.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {SEGMENT_ICONS[segment.name] && (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              color === 'success' ? 'bg-green-100' :
                              color === 'primary' ? 'bg-blue-100' :
                              color === 'secondary' ? 'bg-purple-100' :
                              color === 'warning' ? 'bg-yellow-100' :
                              'bg-red-100'
                            }`}>
                              {(() => {
                                const Icon = SEGMENT_ICONS[segment.name];
                                return <Icon className={`w-5 h-5 ${
                                  color === 'success' ? 'text-green-600' :
                                  color === 'primary' ? 'text-blue-600' :
                                  color === 'secondary' ? 'text-purple-600' :
                                  color === 'warning' ? 'text-yellow-600' :
                                  'text-red-600'
                                }`} />;
                              })()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{segment.name}</p>
                            <p className="text-xs text-gray-500">{segment.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumber(segment.metrics.count)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip color={color as any} variant="flat" size="sm">
                          {formatPercentage(segment.metrics.conversionRate)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(segment.metrics.totalRevenue)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(segment.metrics.avgLTV)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(segment.metrics.avgAOV)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatNumber(segment.metrics.avgOrders, { maximumFractionDigits: 1 })}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      ) : (
        <ChartCard title={t('noSegmentDataTitle')} subtitle={t('noSegmentDataSubtitle')}>
          <div className="text-center py-12 text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold mb-2">{t('noSegmentsFound')}</p>
            <p className="text-sm">{t('tryDifferentPeriod')}</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

