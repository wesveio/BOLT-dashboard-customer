'use client';

import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TruckIcon } from '@heroicons/react/24/outline';
import { useAnalyticsData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export default function ShippingAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.shipping');
  const { data, isLoading, error, refetch } = useAnalyticsData({ type: 'shipping' });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading shipping analytics..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load shipping analytics" onRetry={refetch} />
      </PageWrapper>
    );
  }

  const shippingMethodsData = data?.shippingMethods || [];
  const totalShipments = data?.totalShipments || 0;
  const avgShippingCost = data?.avgShippingCost || '0.00';

  return (
    <PageWrapper>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Shipments"
          value={formatNumber(totalShipments)}
          subtitle="Shipping methods selected"
          icon={<TruckIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Avg Shipping Cost"
          value={formatCurrency(parseFloat(avgShippingCost))}
          subtitle="Average shipping fee"
        />
        <MetricCard
          title="Avg Delivery Time"
          value="3.5 days"
          subtitle="Average delivery duration"
        />
      </div>

      {/* Shipping Methods Chart */}
      <div className="mb-8">
        <ChartCard
          title="Shipping Method Usage"
          subtitle="Distribution of shipping method selections"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shippingMethodsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="method"
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
                dataKey="count"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Shipping Methods Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shippingMethodsData.map((method) => (
          <ChartCard key={method.method} title={method.method}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Selections</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatNumber(method.count)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Delivery</span>
                <span className="text-lg font-bold text-gray-900">
                  {method.avgDays?.toFixed(1) || '0'} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Cost</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(method.avgCost || 0)}
                </span>
              </div>
            </div>
          </ChartCard>
        ))}
      </div>
    </PageWrapper>
  );
}
