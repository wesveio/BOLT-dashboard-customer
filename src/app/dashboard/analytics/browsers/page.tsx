'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/react';

const COLORS = ['#2563eb', '#9333ea', '#10b981', '#f59e0b', '#ef4444'];

export default function BrowserAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.browsers');
  const [browserData, setBrowserData] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBrowserData = async () => {
      try {
        const response = await fetch('/api/dashboard/analytics/browsers?period=week');
        if (response.ok) {
          const data = await response.json();
          setBrowserData(data.browsers || []);
          setPlatformData(data.platforms || []);
          setMetrics({
            totalSessions: data.totalSessions,
            avgConversion: data.avgConversion,
          });
        }
      } catch (error) {
        console.error('Load browser analytics error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBrowserData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading browser analytics...</p>
        </div>
      </div>
    );
  }

  const totalSessions = metrics?.totalSessions || 0;
  const avgConversion = metrics?.avgConversion || '0.0';
  const topBrowser = browserData.length > 0
    ? browserData.reduce((max, item) => item.sessions > max.sessions ? item : max, browserData[0])
    : { browser: 'N/A', sessions: 0 };

  return (
    <m.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title={t('totalSessions')}
          value={totalSessions.toLocaleString()}
          subtitle={t('totalSessionsSubtitle')}
          icon={<GlobeAltIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgConversion')}
          value={`${avgConversion}%`}
          subtitle={t('avgConversionSubtitle')}
        />
        <MetricCard
          title={t('topBrowser')}
          value={topBrowser.browser || 'N/A'}
          subtitle={totalSessions > 0
            ? `${((topBrowser.sessions / totalSessions) * 100).toFixed(1)}% ${t('ofSessions')}`
            : '0%'}
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
                label={({ browser, percent }) => `${browser} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="sessions"
              >
                {browserData.map((entry, index) => (
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
                formatter={(value: number) => [`${value.toFixed(1)}%`, t('conversionRate')]}
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
        {browserData.map((browser, index) => (
          <ChartCard key={browser.browser} title={browser.browser}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('sessions')}</span>
                <span className="text-lg font-bold text-gray-900">
                  {browser.sessions.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('conversionRate')}</span>
                <span className="text-lg font-bold text-green-600">
                  {browser.conversion.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('revenue')}</span>
                <span className="text-lg font-bold text-gray-900">
                  ${browser.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('marketShare')}</span>
                <span className="text-lg font-bold text-gray-900">
                  {browser.marketShare?.toFixed(1) || '0.0'}%
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
        {platformData.map((platform, index) => (
          <ChartCard key={platform.platform} title={platform.platform}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('sessions')}</span>
                <span className="text-lg font-bold text-gray-900">
                  {platform.sessions.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('conversionRate')}</span>
                <span className="text-lg font-bold text-green-600">
                  {platform.conversion?.toFixed(1) || '0.0'}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('revenue')}</span>
                <span className="text-lg font-bold text-gray-900">
                  ${platform.revenue.toLocaleString()}
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
    </m.div>
  );
}

