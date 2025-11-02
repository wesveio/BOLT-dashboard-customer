'use client';

import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useAnalyticsData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

const COLORS = ['#2563eb', '#9333ea', '#10b981', '#f59e0b', '#ef4444'];

export default function BrowserAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.browsers');
  const { data, isLoading, error, refetch } = useAnalyticsData({ type: 'browsers' });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading browser analytics..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load browser analytics" onRetry={refetch} />
      </PageWrapper>
    );
  }

  const browserData = data?.browsers || [];
  const platformData = data?.platforms || [];
  const totalSessions = data?.totalSessions || 0;
  const avgConversion = data?.avgConversion || '0.0';
  const topBrowser = browserData.length > 0
    ? browserData.reduce((max: { browser: string; sessions: number }, item: { browser: string; sessions: number }) => item.sessions > max.sessions ? item : max, browserData[0])
    : { browser: 'N/A', sessions: 0 };
  const topBrowserShare = totalSessions > 0 ? (topBrowser.sessions / totalSessions) * 100 : 0;

  return (
    <PageWrapper>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title={t('totalSessions')}
          value={formatNumber(totalSessions)}
          subtitle={t('totalSessionsSubtitle')}
          icon={<GlobeAltIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgConversion')}
          value={formatPercentage(parseFloat(avgConversion))}
          subtitle={t('avgConversionSubtitle')}
        />
        <MetricCard
          title={t('topBrowser')}
          value={topBrowser.browser || 'N/A'}
          subtitle={formatPercentage(topBrowserShare)}
        />
      </div>

      {/* Browser Distribution Chart */}
      <div className="mb-8">
        <ChartCard
          title={t('browserDistribution')}
          subtitle={t('browserDistributionSubtitle')}
        >
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={browserData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ browser, percent }: { browser: string; percent: number }) => `${browser} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="sessions"
              >
                {browserData.map((_entry: unknown, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Browser Performance */}
      <div className="mb-8">
        <ChartCard
          title={t('browserPerformance')}
          subtitle={t('browserPerformanceSubtitle')}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={browserData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="browser"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                label={{ value: t('conversionRate'), angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${formatPercentage(value)}`, t('conversionRate')]}
              />
              <Bar
                dataKey="conversion"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Browser Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {browserData.map((browser: { browser: string; sessions: number; conversion: number; revenue: number; marketShare?: number }, index: number) => (
          <ChartCard key={browser.browser} title={browser.browser}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('sessions')}</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatNumber(browser.sessions)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('conversionRate')}</span>
                <span className="text-lg font-bold text-green-600">
                  {formatPercentage(browser.conversion)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('revenue')}</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(browser.revenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('marketShare')}</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPercentage(browser.marketShare || 0)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${browser.conversion || 0}%`,
                    background: `linear-gradient(to right, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                  }}
                />
              </div>
            </div>
          </ChartCard>
        ))}
      </div>

      {/* Platform Breakdown */}
      <div className="mb-8">
        <ChartCard
          title={t('platformBreakdown')}
          subtitle={t('platformBreakdownSubtitle')}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="platform"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="sessions"
                fill="#9333ea"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Platform Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {platformData.map((platform: { platform: string; sessions: number; conversion?: number; revenue: number }, index: number) => (
          <ChartCard key={platform.platform} title={platform.platform}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('sessions')}</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatNumber(platform.sessions)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('conversionRate')}</span>
                <span className="text-lg font-bold text-green-600">
                  {formatPercentage(platform.conversion || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('revenue')}</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(platform.revenue)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${platform.conversion || 0}%`,
                    background: `linear-gradient(to right, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                  }}
                />
              </div>
            </div>
          </ChartCard>
        ))}
      </div>
    </PageWrapper>
  );
}
