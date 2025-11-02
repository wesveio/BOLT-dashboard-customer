'use client';

import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/Dashboard/ChartCard/ChartCard';
import { MetricCard } from '@/components/Dashboard/MetricCard/MetricCard';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import { LoadingState } from '@/components/Dashboard/LoadingState/LoadingState';
import { ErrorState } from '@/components/Dashboard/ErrorState/ErrorState';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import { useAnalyticsData } from '@/hooks/useDashboardData';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

const COLORS = ['#2563eb', '#9333ea', '#10b981', '#f59e0b'];

export default function PaymentAnalyticsPage() {
  const t = useTranslations('dashboard.analytics.payment');
  const { data, isLoading, error, refetch } = useAnalyticsData({ type: 'payment' });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <LoadingState message="Loading payment analytics..." fullScreen />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <ErrorState message="Failed to load payment analytics" onRetry={refetch} />
      </PageWrapper>
    );
  }

  const paymentMethodsData = data?.paymentMethods || [];
  const totalPayments = data?.totalPayments || 0;
  const avgSuccessRate = data?.avgSuccessRate || '0.0';

  return (
    <PageWrapper>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

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
          value={formatNumber(totalPayments)}
          subtitle="Total transactions processed"
        />
        <MetricCard
          title="Avg Success Rate"
          value={formatPercentage(parseFloat(avgSuccessRate))}
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
                  {formatNumber(method.value)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(method.revenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span
                  className={`text-lg font-bold ${
                    method.successRate >= 98 ? 'text-green-600' : 'text-orange-600'
                  }`}
                >
                  {formatPercentage(method.successRate || 0)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${method.successRate || 0}%`,
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

