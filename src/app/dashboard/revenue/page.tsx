'use client';

import { useState } from 'react';
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

// TODO: Replace with real data from Supabase
const revenueData = [
  { date: 'Mon', revenue: 4500 },
  { date: 'Tue', revenue: 5200 },
  { date: 'Wed', revenue: 4800 },
  { date: 'Thu', revenue: 6100 },
  { date: 'Fri', revenue: 5500 },
  { date: 'Sat', revenue: 7200 },
  { date: 'Sun', revenue: 6800 },
];

export default function RevenuePage() {
  const t = useTranslations('dashboard.revenue');
  const [period, setPeriod] = useState<Period>('week');

  // TODO: Replace with real calculations
  const totalRevenue = 40100;
  const avgOrderValue = 68.5;
  const totalOrders = 585;
  const revenueGrowth = 12.5;

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
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle="Revenue for selected period"
          trend={{ value: revenueGrowth, isPositive: true }}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgOrderValue')}
          value={`$${avgOrderValue.toFixed(2)}`}
          subtitle="Average transaction value"
          trend={{ value: 3.2, isPositive: true }}
          icon={<ShoppingBagIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('totalOrders')}
          value={totalOrders.toLocaleString()}
          subtitle="Orders processed"
          trend={{ value: 8.5, isPositive: true }}
          icon={<ArrowTrendingUpIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('revenuePerHour')}
          value="$238.7"
          subtitle="Average hourly revenue"
          icon={<ClockIcon className="w-6 h-6 text-white" />}
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
            <LineChart data={revenueData}>
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

