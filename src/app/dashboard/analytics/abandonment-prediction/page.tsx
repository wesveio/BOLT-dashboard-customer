'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Progress, Alert } from '@heroui/react';
import {
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAbandonmentPredictionData } from '@/hooks/useDashboardData';
import { formatNumber, formatPercentage, formatDuration } from '@/utils/formatters';
import { periodOptions, Period } from '@/utils/default-data';

const COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

export default function AbandonmentPredictionPage() {
  const t = useTranslations('dashboard.analytics.abandonmentPrediction');
  const [period, setPeriod] = useState<Period>('week');
  const { summary, predictions, isLoading, error, refetch } = useAbandonmentPredictionData({ period });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading abandonment predictions..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load abandonment predictions" onRetry={refetch} />
      </PageWrapper>
    );
  }

  // Prepare chart data
  const riskDistributionData = [
    { name: 'Low', value: summary.riskDistribution.low, color: COLORS.low },
    { name: 'Medium', value: summary.riskDistribution.medium, color: COLORS.medium },
    { name: 'High', value: summary.riskDistribution.high, color: COLORS.high },
    { name: 'Critical', value: summary.riskDistribution.critical, color: COLORS.critical },
  ].filter(item => item.value > 0);

  const abandonmentByRiskData = Object.entries(summary.abandonmentByRisk)
    .filter(([_, data]) => data.total > 0)
    .map(([level, data]) => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      abandonmentRate: data.rate,
      total: data.total,
      abandoned: data.abandoned,
    }));

  const highRiskSessions = predictions.filter(
    (p) => p.prediction.riskLevel === 'high' || p.prediction.riskLevel === 'critical'
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

      {/* High Risk Alert */}
      {highRiskSessions.length > 0 && (
        <Alert
          color="danger"
          variant="flat"
          className="mb-6"
          startContent={<ExclamationTriangleIcon className="w-5 h-5" />}
        >
          <p className="text-sm font-semibold">
            {highRiskSessions.length} high-risk session{highRiskSessions.length !== 1 ? 's' : ''} detected
          </p>
          <p className="text-xs mt-1">
            Consider implementing intervention strategies for these sessions.
          </p>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Average Risk Score"
          value={summary.avgRiskScore.toFixed(1)}
          subtitle={`${summary.totalSessions} sessions analyzed`}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="High Risk Sessions"
          value={formatNumber(summary.highRiskSessions)}
          subtitle={`${formatPercentage(
            summary.totalSessions > 0 ? (summary.highRiskSessions / summary.totalSessions) * 100 : 0
          )} of total`}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Typical Checkout Time"
          value={formatDuration(summary.typicalCheckoutDuration)}
          subtitle="Based on historical data"
          icon={<ClockIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Avg Checkout Time"
          value={formatDuration(summary.avgCheckoutTime)}
          subtitle="Actual average time"
          icon={<ClockIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Risk Distribution */}
      <div className="mb-8">
        <ChartCard
          title="Risk Distribution"
          subtitle="Sessions by risk level"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Abandonment by Risk Level */}
      {abandonmentByRiskData.length > 0 && (
        <div className="mb-8">
          <ChartCard
            title="Abandonment Rate by Risk Level"
            subtitle="Actual abandonment rates by predicted risk"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={abandonmentByRiskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="level"
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
                  formatter={(value: number, name: string) => [
                    name === 'abandonmentRate' ? `${value.toFixed(1)}%` : formatNumber(value),
                    name === 'abandonmentRate' ? 'Abandonment Rate' : name === 'total' ? 'Total' : 'Abandoned',
                  ]}
                />
                <Bar dataKey="abandonmentRate" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* High Risk Sessions Table */}
      {highRiskSessions.length > 0 ? (
        <ChartCard
          title="High Risk Sessions"
          subtitle="Sessions with high or critical abandonment risk"
        >
          <div className="overflow-x-auto">
            <Table aria-label="High risk sessions table" removeWrapper>
              <TableHeader>
                <TableColumn>SESSION</TableColumn>
                <TableColumn>RISK SCORE</TableColumn>
                <TableColumn>RISK LEVEL</TableColumn>
                <TableColumn>CURRENT STEP</TableColumn>
                <TableColumn>DURATION</TableColumn>
                <TableColumn>ERRORS</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>RECOMMENDATIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {highRiskSessions.slice(0, 20).map((prediction) => {
                  const riskColor = 
                    prediction.prediction.riskLevel === 'critical' ? 'danger' :
                    prediction.prediction.riskLevel === 'high' ? 'danger' :
                    prediction.prediction.riskLevel === 'medium' ? 'warning' :
                    'success';

                  return (
                    <TableRow key={prediction.sessionId}>
                      <TableCell>
                        <span className="text-xs font-mono text-gray-600">
                          {prediction.sessionId.substring(0, 12)}...
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={prediction.prediction.riskScore}
                            color={riskColor}
                            className="flex-1"
                            size="sm"
                          />
                          <span className="text-sm font-semibold text-gray-900 min-w-[50px]">
                            {prediction.prediction.riskScore.toFixed(0)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip color={riskColor} variant="flat" size="sm">
                          {prediction.prediction.riskLevel.toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {prediction.prediction.factors.currentStep}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {formatDuration(prediction.prediction.factors.totalDuration)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-semibold ${
                          prediction.prediction.factors.errorCount > 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {formatNumber(prediction.prediction.factors.errorCount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {prediction.isCompleted ? (
                          <Chip color="success" variant="flat" size="sm" startContent={<CheckCircleIcon className="w-3 h-3" />}>
                            Completed
                          </Chip>
                        ) : prediction.isAbandoned ? (
                          <Chip color="danger" variant="flat" size="sm" startContent={<XCircleIcon className="w-3 h-3" />}>
                            Abandoned
                          </Chip>
                        ) : (
                          <Chip color="warning" variant="flat" size="sm">
                            Active
                          </Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {prediction.prediction.recommendations.slice(0, 2).map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      ) : (
        <ChartCard title="No High Risk Sessions" subtitle="No high-risk sessions detected in the selected period">
          <div className="text-center py-12 text-gray-500">
            <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-green-300" />
            <p className="text-lg font-semibold mb-2">All sessions look good!</p>
            <p className="text-sm">No high-risk abandonment patterns detected.</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

