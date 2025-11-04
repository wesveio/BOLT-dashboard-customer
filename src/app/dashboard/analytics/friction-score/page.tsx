'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Progress } from '@heroui/react';
import {
  ExclamationTriangleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useFrictionScoreData } from '@/hooks/useDashboardData';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { periodOptions, Period } from '@/utils/default-data';

const COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

export default function FrictionScorePage() {
  const t = useTranslations('dashboard.analytics.frictionScore');
  const [period, setPeriod] = useState<Period>('week');
  const { summary, frictionScores, frictionTrend, isLoading, error, refetch } = useFrictionScoreData({ period });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading friction score..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load friction score" onRetry={refetch} />
      </PageWrapper>
    );
  }

  // Prepare chart data
  const frictionDistributionData = useMemo(() => [
    { name: 'Low', value: summary.frictionDistribution.low, color: COLORS.low },
    { name: 'Medium', value: summary.frictionDistribution.medium, color: COLORS.medium },
    { name: 'High', value: summary.frictionDistribution.high, color: COLORS.high },
    { name: 'Critical', value: summary.frictionDistribution.critical, color: COLORS.critical },
  ].filter(item => item.value > 0), [summary.frictionDistribution]);

  const breakdownData = useMemo(() => [
    { name: 'Time', value: summary.frictionBreakdown.timeScore },
    { name: 'Errors', value: summary.frictionBreakdown.errorScore },
    { name: 'Navigation', value: summary.frictionBreakdown.navigationScore },
    { name: 'Completion', value: summary.frictionBreakdown.completionScore },
  ], [summary.frictionBreakdown]);

  const highFrictionSessions = useMemo(() => 
    frictionScores.filter(s => s.score.level === 'high' || s.score.level === 'critical'),
    [frictionScores]
  );

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
          title="Average Friction Score"
          value={summary.avgFrictionScore.toFixed(1)}
          subtitle={`${summary.totalSessions} sessions analyzed`}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="High Friction Sessions"
          value={formatNumber(highFrictionSessions.length)}
          subtitle={`${formatPercentage(
            summary.totalSessions > 0 ? (highFrictionSessions.length / summary.totalSessions) * 100 : 0
          )} of total`}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Low Friction Conversion"
          value={formatPercentage(summary.lowFrictionConversionRate)}
          subtitle="Conversion rate"
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="High Friction Conversion"
          value={formatPercentage(summary.highFrictionConversionRate)}
          subtitle="Conversion rate"
          icon={<XCircleIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Friction Trend */}
      {frictionTrend.length > 0 && (
        <div className="mb-8">
          <ChartCard
            title="Friction Score Trend"
            subtitle="Average friction score and conversion rate over time"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={frictionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9333ea"
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
                  formatter={(value: number, name: string) => [
                    name === 'avgFriction' ? value.toFixed(1) : `${value.toFixed(1)}%`,
                    name === 'avgFriction' ? 'Friction Score' : 'Conversion Rate',
                  ]}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgFriction"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Friction Score"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversionRate"
                  stroke="#9333ea"
                  strokeWidth={2}
                  dot={{ fill: '#9333ea', r: 4 }}
                  name="Conversion Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Friction Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title="Friction Distribution"
          subtitle="Sessions by friction level"
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={frictionDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {frictionDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Friction Breakdown"
          subtitle="Contributors to friction score"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={breakdownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                domain={[0, 40]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* High Friction Sessions */}
      {highFrictionSessions.length > 0 ? (
        <ChartCard
          title="High Friction Sessions"
          subtitle="Sessions with high or critical friction scores"
        >
          <div className="overflow-x-auto">
            <Table aria-label="High friction sessions table" removeWrapper>
              <TableHeader>
                <TableColumn>SESSION</TableColumn>
                <TableColumn>FRICTION SCORE</TableColumn>
                <TableColumn>LEVEL</TableColumn>
                <TableColumn>DURATION</TableColumn>
                <TableColumn>ERRORS</TableColumn>
                <TableColumn>BACK NAVS</TableColumn>
                <TableColumn>CONVERSION</TableColumn>
              </TableHeader>
              <TableBody>
                {highFrictionSessions.slice(0, 20).map((session) => {
                  const frictionColor =
                    session.score.level === 'critical' ? 'danger' :
                    session.score.level === 'high' ? 'danger' :
                    session.score.level === 'medium' ? 'warning' :
                    'success';

                  return (
                    <TableRow key={session.sessionId}>
                      <TableCell>
                        <span className="text-xs font-mono text-gray-600">
                          {session.sessionId.substring(0, 12)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={session.score.score}
                            color={frictionColor}
                            className="flex-1"
                            size="sm"
                          />
                          <span className="text-sm font-semibold text-gray-900 min-w-[50px]">
                            {session.score.score.toFixed(0)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip color={frictionColor as any} variant="flat" size="sm">
                          {session.score.level.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {Math.round(session.score.factors.totalDuration)}s
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-semibold ${
                          session.score.factors.errorCount > 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {formatNumber(session.score.factors.errorCount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatNumber(session.score.factors.backNavigations)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {session.conversion ? (
                          <Chip color="success" variant="flat" size="sm" startContent={<CheckCircleIcon className="w-3 h-3" />}>
                            Yes
                          </Chip>
                        ) : (
                          <Chip color="danger" variant="flat" size="sm" startContent={<XCircleIcon className="w-3 h-3" />}>
                            No
                          </Chip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      ) : (
        <ChartCard title="No High Friction Sessions" subtitle="No high-friction sessions detected in the selected period">
          <div className="text-center py-12 text-gray-500">
            <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-green-300" />
            <p className="text-lg font-semibold mb-2">Low friction detected!</p>
            <p className="text-sm">No high-friction patterns found.</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

