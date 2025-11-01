'use client';

import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { FunnelChart } from '@/components/Dashboard/FunnelChart/FunnelChart';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function PerformancePage() {
  const t = useTranslations('dashboard.performance');

  // TODO: Replace with real data from Supabase
  const funnelData = [
    { step: 'cart', label: 'Cart', count: 1000, percentage: 100 },
    { step: 'profile', label: 'Profile', count: 850, percentage: 85 },
    { step: 'shipping', label: 'Shipping', count: 720, percentage: 72 },
    { step: 'payment', label: 'Payment', count: 650, percentage: 65 },
    { step: 'confirmed', label: 'Confirmed', count: 580, percentage: 58 },
  ];

  const stepMetrics = [
    { step: 'cart', label: 'Cart', avgTime: 120, abandonment: 15 },
    { step: 'profile', label: 'Profile', avgTime: 90, abandonment: 13 },
    { step: 'shipping', label: 'Shipping', avgTime: 180, abandonment: 10 },
    { step: 'payment', label: 'Payment', avgTime: 240, abandonment: 8 },
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
          title={t('conversionRate')}
          value="58.0%"
          subtitle="Overall checkout completion"
          trend={{ value: 2.5, isPositive: true }}
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgCheckoutTime')}
          value="10.5 min"
          subtitle="Time to complete checkout"
          trend={{ value: -5.2, isPositive: true }}
          icon={<ClockIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('abandonmentRate')}
          value="42.0%"
          subtitle="Checkouts abandoned"
          trend={{ value: -2.5, isPositive: true }}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('totalSessions')}
          value="1,000"
          subtitle="Checkout sessions started"
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Funnel Chart */}
      <div className="mb-8">
        <ChartCard title={t('funnelTitle')} subtitle={t('funnelSubtitle')}>
          <FunnelChart data={funnelData} />
        </ChartCard>
      </div>

      {/* Step Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stepMetrics.map((step) => (
          <ChartCard
            key={step.step}
            title={step.label}
            subtitle={`Average time: ${step.avgTime}s | Abandonment: ${step.abandonment}%`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Time</span>
                <span className="text-lg font-bold text-gray-900">
                  {step.avgTime}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Abandonment Rate</span>
                <span className="text-lg font-bold text-red-600">
                  {step.abandonment}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                  style={{ width: `${100 - step.abandonment}%` }}
                />
              </div>
            </div>
          </ChartCard>
        ))}
      </div>
    </m.div>
  );
}

