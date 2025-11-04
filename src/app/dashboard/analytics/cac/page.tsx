'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Alert } from '@heroui/react';
import {
  CurrencyDollarIcon,
  UserPlusIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCACData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { periodOptions, Period } from '@/utils/default-data';

export default function CACAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.cac');
  const [period, setPeriod] = useState<Period>('month');
  const { summary, channels, note, isLoading, error, refetch } = useCACData({ period });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading CAC analytics..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load CAC analytics" onRetry={refetch} />
      </PageWrapper>
    );
  }

  // Prepare chart data
  const channelCACData = channels.slice(0, 10).map((channel) => ({
    channel: channel.channel.length > 15 ? channel.channel.substring(0, 15) + '...' : channel.channel,
    cac: channel.estimatedCAC,
    ltvCacRatio: channel.ltvCacRatio,
    conversions: channel.conversions,
  }));

  const efficiencyColor = summary.acquisitionEfficiency.excellent
    ? 'success'
    : summary.acquisitionEfficiency.good
    ? 'warning'
    : 'danger';

  const efficiencyLabel = summary.acquisitionEfficiency.excellent
    ? 'Excellent'
    : summary.acquisitionEfficiency.good
    ? 'Good'
    : 'Needs Improvement';

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

      {/* Note about estimated CAC */}
      {note && (
        <Alert
          color="warning"
          variant="flat"
          className="mb-6"
          startContent={<ExclamationTriangleIcon className="w-5 h-5" />}
        >
          <p className="text-sm">{note}</p>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Average CAC"
          value={formatCurrency(summary.avgCAC)}
          subtitle="Customer acquisition cost"
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="LTV:CAC Ratio"
          value={summary.ltvCacRatio.toFixed(1)}
          subtitle={efficiencyLabel}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="New Customers"
          value={formatNumber(summary.totalNewCustomers)}
          subtitle="Acquired in period"
          icon={<UserPlusIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Total Marketing Spend"
          value={formatCurrency(summary.totalEstimatedMarketingSpend)}
          subtitle="Estimated spend"
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Acquisition Efficiency Indicator */}
      <div className="mb-8">
        <ChartCard
          title="Acquisition Efficiency"
          subtitle={`LTV:CAC Ratio: ${summary.ltvCacRatio.toFixed(2)}:1`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Target: 3:1 or higher</span>
              <Chip color={efficiencyColor} variant="flat" size="lg">
                {efficiencyLabel}
              </Chip>
            </div>
            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`absolute h-full rounded-full transition-all duration-500 ${
                  summary.acquisitionEfficiency.excellent
                    ? 'bg-green-500'
                    : summary.acquisitionEfficiency.good
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min(100, (summary.ltvCacRatio / 5) * 100)}%`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-700">
                  {summary.ltvCacRatio.toFixed(2)}:1 Ratio
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>0:1</span>
              <span>2:1 (Good)</span>
              <span>3:1 (Excellent)</span>
              <span>5:1+</span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* CAC by Channel */}
      <div className="mb-8">
        <ChartCard
          title="CAC by Acquisition Channel"
          subtitle="Customer acquisition cost by channel"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={channelCACData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="channel"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  name === 'cac' ? formatCurrency(value) : formatNumber(value),
                  name === 'cac' ? 'CAC' : name === 'ltvCacRatio' ? 'LTV:CAC' : 'Conversions',
                ]}
              />
              <Bar dataKey="cac" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Channels Table */}
      {channels.length > 0 ? (
        <ChartCard
          title="Channel Performance"
          subtitle="Detailed metrics by acquisition channel"
        >
          <div className="overflow-x-auto">
            <Table aria-label="Channels table" removeWrapper>
              <TableHeader>
                <TableColumn>CHANNEL</TableColumn>
                <TableColumn>SESSIONS</TableColumn>
                <TableColumn>CONVERSIONS</TableColumn>
                <TableColumn>CONVERSION RATE</TableColumn>
                <TableColumn>ESTIMATED CAC</TableColumn>
                <TableColumn>LTV:CAC RATIO</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody>
                {channels.map((channel, index) => {
                  const isEfficient = channel.ltvCacRatio >= 3;
                  const isGood = channel.ltvCacRatio >= 2 && channel.ltvCacRatio < 3;
                  
                  return (
                    <TableRow key={`${channel.channel}-${index}`}>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">{channel.channel}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumber(channel.sessions)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumber(channel.conversions)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatPercentage(channel.conversionRate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(channel.estimatedCAC)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm font-semibold ${
                            isEfficient ? 'text-green-600' : isGood ? 'text-yellow-600' : 'text-red-600'
                          }`}
                        >
                          {channel.ltvCacRatio.toFixed(1)}:1
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={isEfficient ? 'success' : isGood ? 'warning' : 'danger'}
                          variant="flat"
                          size="sm"
                        >
                          {isEfficient ? 'Excellent' : isGood ? 'Good' : 'Needs Work'}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      ) : (
        <ChartCard title="No Channel Data" subtitle="No acquisition channel data available in the selected period">
          <div className="text-center py-12 text-gray-500">
            <UserPlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold mb-2">No channel data found</p>
            <p className="text-sm">Try selecting a different time period.</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

