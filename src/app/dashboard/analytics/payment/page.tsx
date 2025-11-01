'use client';

import { useTranslations } from 'next-intl';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CreditCardIcon } from '@heroicons/react/24/outline';

// TODO: Replace with real data from Supabase
const paymentMethodsData = [
  { name: 'Credit Card', value: 45, revenue: 18045, successRate: 98.5 },
  { name: 'Debit Card', value: 25, revenue: 10025, successRate: 97.2 },
  { name: 'PIX', value: 20, revenue: 8020, successRate: 99.8 },
  { name: 'Bank Transfer', value: 10, revenue: 4010, successRate: 95.1 },
];

const COLORS = ['#2563eb', '#9333ea', '#10b981', '#f59e0b'];

export default function PaymentAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.payment');

  const totalPayments = paymentMethodsData.reduce((sum, item) => sum + item.value, 0);

  return (
    <m.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Payment Methods"
          value={paymentMethodsData.length.toString()}
          subtitle="Active payment options"
          icon={<CreditCardIcon className="w-6 h-6 text-white" />}
        />
        <MetricCard
          title="Transactions"
          value={totalPayments.toLocaleString()}
          subtitle="Total transactions processed"
        />
        <MetricCard
          title="Avg Success Rate"
          value="97.7%"
          subtitle="Average payment success rate"
        />
      </div>

      {/* Payment Distribution Chart */}
      <div className="mb-8">
        <ChartCard
          title="Payment Method Distribution"
          subtitle="Percentage of transactions by payment method"
        >
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={paymentMethodsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Payment Methods Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paymentMethodsData.map((method, index) => (
          <ChartCard key={method.name} title={method.name}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transactions</span>
                <span className="text-lg font-bold text-gray-900">
                  {method.value.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="text-lg font-bold text-gray-900">
                  ${method.revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span
                  className={`text-lg font-bold ${
                    method.successRate >= 98 ? 'text-green-600' : 'text-orange-600'
                  }`}
                >
                  {method.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${method.successRate}%`,
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

