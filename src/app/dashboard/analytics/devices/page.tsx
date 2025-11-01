'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@heroui/react';

const COLORS = ['#2563eb', '#9333ea', '#10b981'];

export default function DeviceAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.devices');
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDeviceData = async () => {
      try {
        const response = await fetch('/api/dashboard/analytics/devices?period=week');
        if (response.ok) {
          const data = await response.json();
          setDeviceData(data.devices || []);
          setMetrics({
            totalSessions: data.totalSessions,
            avgConversion: data.avgConversion,
          });
        }
      } catch (error) {
        console.error('Load device analytics error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeviceData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading device analytics...</p>
        </div>
      </div>
    );
  }

  const totalSessions = metrics?.totalSessions || 0;

  return (
    <m.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Sessions"
          value={totalSessions.toLocaleString()}
          subtitle="Checkout sessions started"
          icon={<DevicePhoneMobileIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Avg Conversion"
          value={`${metrics?.avgConversion || '0.0'}%`}
          subtitle="Average conversion rate"
        />
        <MetricCard
          title="Mobile Share"
          value={deviceData.length > 0 && totalSessions > 0
            ? `${((deviceData.find(d => d.device === 'Mobile')?.sessions || 0) / totalSessions * 100).toFixed(1)}%`
            : '0%'}
          subtitle="Percentage of mobile sessions"
        />
      </div>

      {/* Device Distribution Chart */}
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
                label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="sessions"
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Device Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {deviceData.map((device, index) => (
          <ChartCard key={device.device} title={device.device}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sessions</span>
                <span className="text-lg font-bold text-gray-900">
                  {device.sessions.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {device.conversion.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="text-lg font-bold text-gray-900">
                  ${device.revenue.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${device.conversion}%`,
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

