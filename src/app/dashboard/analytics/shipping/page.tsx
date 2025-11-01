'use client';

import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TruckIcon } from '@heroicons/react/24/outline';

// TODO: Replace with real data from Supabase
const shippingMethodsData = [
  { method: 'Standard', count: 350, avgDays: 5, avgCost: 12.5 },
  { method: 'Express', count: 180, avgDays: 2, avgCost: 25.0 },
  { method: 'Same Day', count: 50, avgDays: 1, avgCost: 45.0 },
];

export default function ShippingAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.shipping');

  const totalShipments = shippingMethodsData.reduce((sum, item) => sum + item.count, 0);
  const avgShippingCost =
    shippingMethodsData.reduce((sum, item) => sum + item.avgCost * item.count, 0) /
    totalShipments;

  return (
    <m.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Shipments"
          value={totalShipments.toLocaleString()}
          subtitle="Shipping methods selected"
          icon={<TruckIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Avg Shipping Cost"
          value={`$${avgShippingCost.toFixed(2)}`}
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
                  {method.count.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Delivery</span>
                <span className="text-lg font-bold text-gray-900">
                  {method.avgDays} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Cost</span>
                <span className="text-lg font-bold text-gray-900">
                  ${method.avgCost.toFixed(2)}
                </span>
              </div>
            </div>
          </ChartCard>
        ))}
      </div>
    </m.div>
  );
}

