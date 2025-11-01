'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { FunnelChart } from '@/components/Dashboard/FunnelChart/FunnelChart';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { RealtimeIndicator } from '@/components/Dashboard/RealtimeIndicator/RealtimeIndicator';
import { Spinner } from '@heroui/react';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function PerformancePage() {
  const t = useTranslations('dashboard.performance');
  const [metrics, setMetrics] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [stepMetrics, setStepMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        const response = await fetch('/api/dashboard/performance?period=week');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
          setFunnelData(data.funnel);
          setStepMetrics(data.stepMetrics);
        }
      } catch (error) {
        console.error('Load performance data error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  // Default data if API returns empty
  const defaultFunnelData = [
    { step: 'cart', label: 'Cart', count: 1000, percentage: 100 },
    { step: 'profile', label: 'Profile', count: 850, percentage: 85 },
    { step: 'shipping', label: 'Shipping', count: 720, percentage: 72 },
    { step: 'payment', label: 'Payment', count: 650, percentage: 65 },
    { step: 'confirmed', label: 'Confirmed', count: 0, percentage: 0 },
  ];

  const defaultStepMetrics = [
    { step: 'cart', label: 'Cart', avgTime: 0, abandonment: 0 },
    { step: 'profile', label: 'Profile', avgTime: 0, abandonment: 0 },
    { step: 'shipping', label: 'Shipping', avgTime: 0, abandonment: 0 },
    { step: 'payment', label: 'Payment', avgTime: 0, abandonment: 0 },
  ];

  const displayFunnelData = funnelData.length > 0 ? funnelData : defaultFunnelData;
  const displayStepMetrics = stepMetrics.length > 0 ? stepMetrics : defaultStepMetrics;
  const displayMetrics = metrics || {
    conversionRate: '0.0',
    avgCheckoutTime: 0,
    abandonmentRate: '0.0',
    totalSessions: 0,
  };

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
          value={`${displayMetrics.conversionRate}%`}
          subtitle="Overall checkout completion"
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('avgCheckoutTime')}
          value={`${Math.round(displayMetrics.avgCheckoutTime / 60)} min`}
          subtitle="Time to complete checkout"
          icon={<ClockIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('abandonmentRate')}
          value={`${displayMetrics.abandonmentRate}%`}
          subtitle="Checkouts abandoned"
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title={t('totalSessions')}
          value={displayMetrics.totalSessions?.toLocaleString() || '0'}
          subtitle="Checkout sessions started"
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
        />
      </div>

      {/* Funnel Chart */}
      <div className="mb-8">
        <ChartCard title={t('funnelTitle')} subtitle={t('funnelSubtitle')}>
          <FunnelChart data={displayFunnelData} />
        </ChartCard>
      </div>

      {/* Step Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayStepMetrics.map((step) => (
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

