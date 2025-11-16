'use client';

import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Progress } from '@heroui/react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMicroConversionsData } from '@/hooks/useDashboardData';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { periodOptions, type Period } from '@/utils/default-data';
import { usePeriod } from '@/contexts/PeriodContext';

const COLORS = {
  high: '#10b981', // green
  medium: '#f59e0b', // orange
  low: '#ef4444', // red
};

export default function MicroConversionsPage() {
  const t = useTranslations('dashboard.analytics.microConversions');
  const { period, setPeriod, startDate, endDate } = usePeriod();
  const { microConversions, dropOffs, summary, isLoading, error, refetch } = useMicroConversionsData({ period, startDate, endDate });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading micro-conversions analytics..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load micro-conversions analytics" onRetry={refetch} />
      </PageWrapper>
    );
  }

  // Prepare chart data with color coding based on conversion rate
  const chartData = microConversions.map((mc) => ({
    ...mc,
    color: mc.conversionRate >= 80 ? COLORS.high : mc.conversionRate >= 50 ? COLORS.medium : COLORS.low,
  }));

  // Get drop-off analysis
  const totalDropOff = dropOffs.reduce((sum, d) => sum + d.dropOff, 0);
  const maxDropOff = Math.max(...dropOffs.map(d => d.dropOff), 0);
  const worstDropOffStep = dropOffs.find(d => d.dropOff === maxDropOff);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Sessions"
          value={formatNumber(summary.totalSessions)}
          subtitle="Checkout sessions analyzed"
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Overall Conversion"
          value={formatPercentage(summary.overallConversionRate)}
          subtitle="Final checkout completion rate"
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Total Drop-offs"
          value={formatNumber(totalDropOff)}
          subtitle={worstDropOffStep ? `Worst: ${worstDropOffStep.step}` : 'Users who abandoned'}
          icon={<ArrowTrendingDownIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Micro-conversions Chart */}
      <div className="mb-8">
        <ChartCard
          title="Micro-conversion Rates by Step"
          subtitle="Conversion rate at each checkout step"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="label"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}%`,
                  name === 'conversionRate' ? 'Conversion Rate' : 'Value',
                ]}
                labelFormatter={(label) => `Step: ${label}`}
              />
              <Bar dataKey="conversionRate" radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Micro-conversions Details Table */}
      <ChartCard
        title="Detailed Micro-conversion Analysis"
        subtitle="Step-by-step breakdown of user progression"
      >
        <div className="overflow-x-auto">
          <Table aria-label="Micro-conversions table" removeWrapper>
            <TableHeader>
              <TableColumn>STEP</TableColumn>
              <TableColumn>LABEL</TableColumn>
              <TableColumn>REACHED</TableColumn>
              <TableColumn>COMPLETED</TableColumn>
              <TableColumn>CONVERSION RATE</TableColumn>
              <TableColumn>DROP-OFF</TableColumn>
              <TableColumn>STATUS</TableColumn>
            </TableHeader>
            <TableBody>
              {microConversions.map((mc, index) => {
                const dropOff = dropOffs[index];
                const statusColor = mc.conversionRate >= 80 ? 'success' : mc.conversionRate >= 50 ? 'warning' : 'danger';
                const statusLabel = mc.conversionRate >= 80 ? 'Excellent' : mc.conversionRate >= 50 ? 'Good' : 'Needs Improvement';

                return (
                  <TableRow key={mc.step}>
                    <TableCell>
                      <Chip color={statusColor} variant="flat" size="sm">
                        {mc.step}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{mc.label}</p>
                        <p className="text-xs text-foreground/60">{mc.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-foreground">
                        {formatNumber(mc.reached)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-foreground">
                        {formatNumber(mc.completed)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={mc.conversionRate}
                          color={statusColor}
                          className="flex-1"
                          size="sm"
                        />
                        <span className="text-sm font-semibold text-foreground min-w-[60px]">
                          {formatPercentage(mc.conversionRate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dropOff && dropOff.dropOff > 0 ? (
                        <div className="flex items-center gap-2">
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-semibold text-red-600">
                            {formatNumber(dropOff.dropOff)}
                          </span>
                          {dropOff.dropOffRate !== undefined && (
                            <span className="text-xs text-foreground/60">
                              ({formatPercentage(dropOff.dropOffRate)})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-foreground/40">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip color={statusColor} variant="flat" size="sm">
                        {statusLabel}
                      </Chip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </PageWrapper>
  );
}

