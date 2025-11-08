'use client';

import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useAnalyticsData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

const COLORS = ['#2563eb', '#9333ea', '#10b981'];

export default function DeviceAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.devices');
  const { data, isLoading, error, refetch } = useAnalyticsData({ type: 'devices' });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading device analytics..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load device analytics" onRetry={refetch} />
      </PageWrapper>
    );
  }

  const deviceData = (Array.isArray(data?.devices) ? data.devices : []) as Array<{ device: string; sessions: number; conversion: number; revenue: number }>;
  const totalSessions = typeof data?.totalSessions === 'number' ? data.totalSessions : 0;
  const avgConversion = typeof data?.avgConversion === 'string' ? data.avgConversion : '0.0';
  const mobileSessions = deviceData.find((d: { device: string }) => d.device === 'Mobile')?.sessions || 0;
  const mobileShare = totalSessions > 0 ? (mobileSessions / totalSessions) * 100 : 0;

  return (
    <PageWrapper>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Sessions"
          value={formatNumber(totalSessions)}
          subtitle="Checkout sessions started"
          icon={<DevicePhoneMobileIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Avg Conversion"
          value={formatPercentage(parseFloat(avgConversion))}
          subtitle="Average conversion rate"
        />
        <MetricCard
          title="Mobile Share"
          value={formatPercentage(mobileShare)}
          subtitle="Percentage of mobile sessions"
        />
      </div>

      {/* Device Distribution Chart */}
      {deviceData.length > 0 ? (
        <>
          <div className="mb-8">
            <ChartCard
              title="Device Distribution"
              subtitle="Sessions by device type"
            >
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ device, percent }: { device: string; percent: number }) => `${device} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="sessions"
                    nameKey="device"
                  >
                    {deviceData.map((_entry: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(value: string) => value} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Device Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deviceData.map((device: { device: string; sessions: number; conversion: number; revenue: number }, index: number) => (
              <ChartCard key={device.device} title={device.device}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sessions</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatNumber(device.sessions)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatPercentage(device.conversion || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Revenue</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(device.revenue || 0)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${device.conversion || 0}%`,
                        background: `linear-gradient(to right, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                      }}
                    />
                  </div>
                </div>
              </ChartCard>
            ))}
          </div>
        </>
      ) : (
        <ChartCard title="No Device Data" subtitle="No device data available for the selected period">
          <div className="text-center py-12 text-gray-500">
            <DevicePhoneMobileIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-semibold mb-2">No device data found</p>
            <p className="text-sm">Try selecting a different time period.</p>
          </div>
        </ChartCard>
      )}
    </PageWrapper>
  );
}
