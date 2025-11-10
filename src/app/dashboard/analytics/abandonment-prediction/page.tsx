'use client';

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
import { getTranslatedPeriodOptions, type Period } from '@/utils/default-data';
import { usePeriod } from '@/contexts/PeriodContext';

const COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

export default function AbandonmentPredictionPage() {
  const t = useTranslations('dashboard.analytics.abandonmentPrediction');
  const tPeriods = useTranslations('dashboard.common.periods');
  const { period, setPeriod, startDate, endDate } = usePeriod();
  const { summary, predictions, isLoading, error, refetch } = useAbandonmentPredictionData({ period, startDate, endDate });

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
  const riskDistributionData = [
    { name: t('low'), value: summary.riskDistribution.low, color: COLORS.low },
    { name: t('medium'), value: summary.riskDistribution.medium, color: COLORS.medium },
    { name: t('high'), value: summary.riskDistribution.high, color: COLORS.high },
    { name: t('critical'), value: summary.riskDistribution.critical, color: COLORS.critical },
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
    (p) => p?.prediction?.riskLevel === 'high' || p?.prediction?.riskLevel === 'critical'
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
            {getTranslatedPeriodOptions(tPeriods).map((option) => (
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
            {highRiskSessions.length} {t('highRiskSessionsDetected', { 
              plural: highRiskSessions.length !== 1 ? 's' : '' 
            })}
          </p>
          <p className="text-xs mt-1">
            {t('implementInterventions')}
          </p>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('averageRiskScore')}
          value={summary.avgRiskScore.toFixed(1)}
          subtitle={`${summary.totalSessions} ${t('sessionsAnalyzed')}`}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('highRiskSessions')}
          value={formatNumber(summary.highRiskSessions)}
          subtitle={`${formatPercentage(
            summary.totalSessions > 0 ? (summary.highRiskSessions / summary.totalSessions) * 100 : 0
          )} ${t('ofTotal')}`}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('typicalCheckoutTime')}
          value={formatDuration(summary.typicalCheckoutDuration)}
          subtitle={t('basedOnHistorical')}
          icon={<ClockIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgCheckoutTime')}
          value={formatDuration(summary.avgCheckoutTime)}
          subtitle={t('actualAverageTime')}
          icon={<ClockIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Risk Distribution */}
      <div className="mb-8">
        <ChartCard
          title={t('riskDistributionTitle')}
          subtitle={t('riskDistributionSubtitle')}
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
            title={t('abandonmentByRiskTitle')}
            subtitle={t('abandonmentByRiskSubtitle')}
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
                    name === 'abandonmentRate' ? formatPercentage(value) : formatNumber(value),
                    name === 'abandonmentRate' ? t('abandonmentRate') : name === 'total' ? t('total') : t('abandoned'),
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
          title={t('highRiskSessionsTitle')}
          subtitle={t('highRiskSessionsSubtitle')}
        >
          <div className="overflow-x-auto">
            <Table aria-label="High risk sessions table" removeWrapper>
              <TableHeader>
                <TableColumn>{t('session')}</TableColumn>
                <TableColumn>{t('riskScore')}</TableColumn>
                <TableColumn>{t('riskLevel')}</TableColumn>
                <TableColumn>{t('currentStep')}</TableColumn>
                <TableColumn>{t('duration')}</TableColumn>
                <TableColumn>{t('errors')}</TableColumn>
                <TableColumn>{t('status')}</TableColumn>
                <TableColumn>{t('recommendations')}</TableColumn>
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
                            {t('completed')}
                          </Chip>
                        ) : prediction.isAbandoned ? (
                          <Chip color="danger" variant="flat" size="sm" startContent={<XCircleIcon className="w-3 h-3" />}>
                            {t('abandoned')}
                          </Chip>
                        ) : (
                          <Chip color="warning" variant="flat" size="sm">
                            {t('active')}
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
        <ChartCard title={t('noHighRiskTitle')} subtitle={t('noHighRiskSubtitle')}>
          <div className="text-center py-12 text-gray-500">
            <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-green-300" />
            <p className="text-lg font-semibold mb-2">{t('allSessionsGood')}</p>
            <p className="text-sm">{t('noHighRiskPatterns')}</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}

