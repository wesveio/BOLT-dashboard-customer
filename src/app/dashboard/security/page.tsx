'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardBody } from '@heroui/react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  XCircleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { PeriodSelector } from '@/components/Dashboard/PeriodSelector/PeriodSelector';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import { useApi } from '@/hooks/useApi';
import { usePeriod } from '@/contexts/PeriodContext';
import { formatNumber, formatPercentage } from '@/utils/formatters';

interface SecurityMetrics {
  totalTransactions: number;
  highRiskTransactions: number;
  blockedTransactions: number;
  fraudDetected: number;
  avgRiskScore: number;
  validationErrors: number;
  scaRequired: number;
  anomaliesDetected: number;
}

interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface SecurityData {
  metrics: SecurityMetrics;
  riskDistribution: RiskDistribution;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: string;
  }>;
  trendData: Array<{
    date: string;
    transactions: number;
    highRisk: number;
    blocked: number;
  }>;
}

export default function SecurityPage() {
  const t = useTranslations('dashboard.security');
  const { period, startDate, endDate } = usePeriod();

  const { data, isLoading, error, refetch } = useApi<SecurityData>(
    `/api/dashboard/security?period=${period}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`,
    {
      cacheKey: 'security',
      cacheTTL: 1, // 1 minute cache for real-time data
    },
  );

  const metrics = data?.metrics || {
    totalTransactions: 0,
    highRiskTransactions: 0,
    blockedTransactions: 0,
    fraudDetected: 0,
    avgRiskScore: 0,
    validationErrors: 0,
    scaRequired: 0,
    anomaliesDetected: 0,
  };

  const riskDistribution = data?.riskDistribution || {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  // Calculate percentages
  const highRiskPercentage = useMemo(() => {
    if (metrics.totalTransactions === 0) return 0;
    return (metrics.highRiskTransactions / metrics.totalTransactions) * 100;
  }, [metrics]);

  const blockedPercentage = useMemo(() => {
    if (metrics.totalTransactions === 0) return 0;
    return (metrics.blockedTransactions / metrics.totalTransactions) * 100;
  }, [metrics]);

  const fraudRate = useMemo(() => {
    if (metrics.totalTransactions === 0) return 0;
    return (metrics.fraudDetected / metrics.totalTransactions) * 100;
  }, [metrics]);

  // Prepare chart data
  const riskChartData = useMemo(() => {
    return {
      labels: ['Low', 'Medium', 'High', 'Critical'],
      datasets: [
        {
          label: 'Risk Distribution',
          data: [riskDistribution.low, riskDistribution.medium, riskDistribution.high, riskDistribution.critical],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#dc2626'],
        },
      ],
    };
  }, [riskDistribution]);

  const trendChartData = useMemo(() => {
    const trend = data?.trendData || [];
    return {
      labels: trend.map((d) => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Total Transactions',
          data: trend.map((d) => d.transactions),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
          label: 'High Risk',
          data: trend.map((d) => d.highRisk),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        },
        {
          label: 'Blocked',
          data: trend.map((d) => d.blocked),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
        },
      ],
    };
  }, [data]);

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState fullScreen={true} />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message={t('messages.failedToLoad')} onRetry={refetch} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <div className="flex items-center gap-4">
            <RealtimeIndicator isActive={true} />
            <PeriodSelector />
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('metrics.totalTransactions')}
          value={formatNumber(metrics.totalTransactions)}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('metrics.highRiskTransactions')}
          value={formatNumber(metrics.highRiskTransactions)}
          subtitle={`${formatPercentage(highRiskPercentage)} of total`}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('metrics.blockedTransactions')}
          value={formatNumber(metrics.blockedTransactions)}
          subtitle={`${formatPercentage(blockedPercentage)} of total`}
          icon={<XCircleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('metrics.avgRiskScore')}
          value={metrics.avgRiskScore.toFixed(1)}
          subtitle="0-100 scale"
          icon={<ShieldCheckIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('metrics.fraudDetected')}
          value={formatNumber(metrics.fraudDetected)}
          subtitle={`${formatPercentage(fraudRate)} fraud rate`}
          icon={<LockClosedIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('metrics.validationErrors')}
          value={formatNumber(metrics.validationErrors)}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('metrics.scaRequired')}
          value={formatNumber(metrics.scaRequired)}
          icon={<ShieldCheckIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('metrics.anomaliesDetected')}
          value={formatNumber(metrics.anomaliesDetected)}
          icon={<EyeIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title={t('charts.riskDistribution')}
          chartType="doughnut"
          data={riskChartData}
          height={300}
        />
        <ChartCard
          title={t('charts.trends')}
          chartType="line"
          data={trendChartData}
          height={300}
        />
      </div>

      {/* Recent Alerts */}
      {data?.recentAlerts && data.recentAlerts.length > 0 && (
        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('recentAlerts.title')}</h3>
            <div className="space-y-3">
              {data.recentAlerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'high'
                        ? 'bg-orange-50 border-orange-200'
                        : alert.severity === 'medium'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            alert.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : alert.severity === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : alert.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{alert.type}</span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </PageWrapper>
  );
}

