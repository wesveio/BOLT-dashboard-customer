'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectItem } from '@heroui/react';

type Period = 'today' | 'week' | 'month' | 'year';

const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'year', label: 'Last 12 months' },
];

export default function RevenuePage() {
  const t = useTranslations('dashboard.revenue');
  const [period, setPeriod] = useState<Period>('week');
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRevenueData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/dashboard/revenue?period=${period}`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
          setRevenueData(data.chartData);
        }
      } catch (error) {
        console.error('Load revenue data error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRevenueData();
  }, [period]);

  const displayMetrics = metrics || {
    totalRevenue: 0,
    avgOrderValue: '0.00',
    totalOrders: 0,
    revenuePerHour: '0.00',
    revenueGrowth: '0.0',
  };

  const displayRevenueData = revenueData.length > 0 ? revenueData : [
    { date: 'Mon', revenue: 0 },
    { date: 'Tue', revenue: 0 },
    { date: 'Wed', revenue: 0 },
    { date: 'Thu', revenue: 0 },
    { date: 'Fri', revenue: 0 },
    { date: 'Sat', revenue: 0 },
    { date: 'Sun', revenue: 0 },
  ];

  return (
    <m.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
            <p className="text-gray-600">{t('subtitle')}</p>
          </div>
          <RealtimeIndicator isActive={true} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('totalRevenue')}
          value={`$${Number(displayMetrics.totalRevenue).toLocaleString()}`}
          subtitle="Revenue for selected period"
          trend={{ value: parseFloat(displayMetrics.revenueGrowth || '0'), isPositive: parseFloat(displayMetrics.revenueGrowth || '0') > 0 }}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('avgOrderValue')}
          value={`$${displayMetrics.avgOrderValue}`}
          subtitle="Average transaction value"
          icon={<ShoppingBagIcon className="w-6 h-6 text-white" />}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('totalOrders')}
          value={Number(displayMetrics.totalOrders).toLocaleString()}
          subtitle="Orders processed"
          icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
          isLoading={isLoading}
        />
        <MetricCard
          title={t('revenuePerHour')}
          value={`$${displayMetrics.revenuePerHour}`}
          subtitle="Average hourly revenue"
          icon={<ClockIcon className="w-6 h-6 text-white" />}
          isLoading={isLoading}
        />
      </div>

      {/* Revenue Chart */}
      <div className="mb-8">
        <ChartCard 
          title={t('trendTitle')} 
          subtitle={t('trendSubtitle')}
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
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={displayRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Additional Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Revenue by Hour" subtitle="Peak hours analysis">
          <div className="text-center py-8 text-gray-500">
            Hourly breakdown chart coming soon
          </div>
        </ChartCard>
        <ChartCard title="Revenue by Day" subtitle="Weekly pattern">
          <div className="text-center py-8 text-gray-500">
            Daily breakdown chart coming soon
          </div>
        </ChartCard>
      </div>
    </m.div>
  );
}

